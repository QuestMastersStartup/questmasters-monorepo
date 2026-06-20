"""
Servidor DM para RunPod Pod.

Uso:
    HF_TOKEN=<token> python pod_server.py

El modelo se carga desde /runpod-volume/shared/base_model.
Expone FastAPI en puerto 8000.
"""
from __future__ import annotations

import json
import queue
import threading
import time
import re
import unicodedata
from pathlib import Path
from typing import Any, AsyncGenerator

import torch
import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TextIteratorStreamer

# ─── Config ───────────────────────────────────────────────────────────

BASE_MODEL_PATH = Path("/runpod-volume/shared/base_model")
LORA_BASE_PATH = Path("/runpod-volume/shared/lora_weights")

# Poner en False para activar LoRAs, True para modelo base puro
USE_BASE_MODEL_ONLY = True

LORA_NAMES = {
    "narrator": "narrator",
    "arbiter": "arbiter",
    "npc": "npc",
    "state": "state",
    "monolithic": "monolithic",
}

# ─── Schemas ──────────────────────────────────────────────────────────

class CharacterSnapshot(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    race: str = ""
    class_name: str = Field(default="", alias="class")
    background: str = ""
    description: str = ""


class DmModelRequest(BaseModel):
    session_id: str
    architecture_type: str
    model_id: str
    campaign_prompt: str
    characters: list[CharacterSnapshot]
    conversation_history: list[dict]
    player_input: str | None = None
    current_memory_snapshot: dict = {}


# ─── Cargar modelo ────────────────────────────────────────────────────

def load_model():
    print("=" * 60)
    print(f"Cargando modelo desde {BASE_MODEL_PATH}")

    if not BASE_MODEL_PATH.exists():
        raise RuntimeError(f"Modelo no encontrado en {BASE_MODEL_PATH}")

    if torch.cuda.is_available():
        free, total = torch.cuda.mem_get_info(0)
        free_gb = free / 1024**3
        total_gb = total / 1024**3
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {free_gb:.1f} GB libre / {total_gb:.1f} GB total")
    else:
        free_gb = 0.0
        print("CUDA no disponible — esto no va a funcionar bien")

    if free_gb >= 30:
        print("Cargando en float16 (VRAM suficiente)")
        model = AutoModelForCausalLM.from_pretrained(
            str(BASE_MODEL_PATH),
            torch_dtype=torch.float16,
            device_map={"": 0},
        )
    else:
        print("Cargando en 4-bit NF4")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )
        model = AutoModelForCausalLM.from_pretrained(
            str(BASE_MODEL_PATH),
            quantization_config=bnb_config,
            device_map={"": 0},
        )

    tokenizer = AutoTokenizer.from_pretrained(str(BASE_MODEL_PATH))

    if not USE_BASE_MODEL_ONLY:
        from peft import PeftModel
        first_name = list(LORA_NAMES.keys())[0]
        lora_path = LORA_BASE_PATH / LORA_NAMES[first_name]
        if lora_path.exists():
            print(f"Cargando LoRA '{first_name}'...")
            model = PeftModel.from_pretrained(model, str(lora_path), adapter_name=first_name)
            for name, folder in list(LORA_NAMES.items())[1:]:
                path = LORA_BASE_PATH / folder
                if path.exists():
                    print(f"Cargando LoRA '{name}'...")
                    model.load_adapter(str(path), adapter_name=name)
                else:
                    print(f"LoRA '{name}' no encontrado en {path}, saltando")
        else:
            print(f"LoRA base no encontrado en {lora_path}, usando modelo sin adapters")

    if torch.cuda.is_available():
        free, _ = torch.cuda.mem_get_info(0)
        print(f"VRAM libre tras carga: {free / 1024**3:.1f} GB")

    mode = "BASE (sin LoRA)" if USE_BASE_MODEL_ONLY else "con LoRAs"
    print(f"Modelo listo — {mode}")
    print("=" * 60)
    return model, tokenizer


# ─── Prompt ───────────────────────────────────────────────────────────

_SYSTEM_BASE = """\
Eres un Dungeon Master de D&D 5e. Responde en español.

REGLAS:
- Máximo 3 párrafos cortos por respuesta.
- Oraciones cortas. Máximo 20 palabras por oración.
- NO inventes palabras raras ni nombres absurdos.
- Usa "tú" para dirigirte al jugador. NO uses "vosotros".
- Solo hay los personajes listados abajo. NO inventes más.
- Sé concreto: describe lo que el personaje ve, oye y huele.
- Termina con una pregunta clara: "¿Qué haces?" o similar."""

_OPENING_EXTRA = """
ESCENA INICIAL:
1. Describe el lugar en 2-3 oraciones cortas.
2. Describe por qué el personaje está ahí en 1-2 oraciones.
3. Presenta UN evento o persona que llame la atención.
4. Pregunta qué hace el jugador."""

_TURN_EXTRA = """
- Responde directamente a lo que el jugador dijo.
- Describe lo que pasa en 2-3 oraciones.
- Pregunta qué hace el jugador."""


def _is_opening_turn(request: DmModelRequest) -> bool:
    return not request.player_input and len(request.conversation_history) == 0


def _build_messages(request: DmModelRequest) -> list[dict]:
    chars = []
    for c in request.characters:
        parts = [c.name]
        if c.race:
            parts.append(c.race)
        if c.class_name:
            parts.append(c.class_name)
        chars.append(", ".join(parts))
    chars_block = "\n".join(f"- {c}" for c in chars) if chars else "- Sin personajes"

    opening = _is_opening_turn(request)
    extra = _OPENING_EXTRA if opening else _TURN_EXTRA

    system = (
        f"{_SYSTEM_BASE}\n{extra}\n\n"
        f"Campaña: {request.campaign_prompt}\n\n"
        f"Personajes:\n{chars_block}"
    )

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]

    for turn in request.conversation_history[-6:]:
        role = "user" if turn.get("role") == "player" else "assistant"
        messages.append({"role": role, "content": turn["content"]})

    if request.player_input:
        messages.append({"role": "user", "content": request.player_input})

    return messages


# ─── Generación ───────────────────────────────────────────────────────

def _clean_response(text: str) -> str:
    cleaned = []
    for char in text:
        cat = unicodedata.category(char)
        if cat.startswith("So") or cat.startswith("Cs"):
            continue
        if ord(char) > 0x2000 and char not in "—–''\"\"…·":
            continue
        cleaned.append(char)
    return "".join(cleaned)


def _generate_to_queue(
    request: DmModelRequest,
    q: queue.Queue,
    model: Any,
    tokenizer: Any,
) -> None:
    import traceback
    try:
        if not USE_BASE_MODEL_ONLY and hasattr(model, "set_adapter"):
            adapter = "monolithic" if request.architecture_type == "monolithic" else "narrator"
            model.set_adapter(adapter)
            print(f"[gen] Adapter: {adapter}")
        else:
            if hasattr(model, "disable_adapter_layers"):
                model.disable_adapter_layers()
            print("[gen] Modelo BASE")

        opening = _is_opening_turn(request)
        messages = _build_messages(request)
        input_ids = tokenizer.apply_chat_template(
            messages,
            return_tensors="pt",
            add_generation_prompt=True,
            return_dict=False,
        ).to(model.device)

        streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)

        gen_kwargs = {
            "input_ids": input_ids,
            "max_new_tokens": 400 if opening else 250,
            "temperature": 0.6,
            "top_k": 40,
            "top_p": 0.9,
            "do_sample": True,
            "streamer": streamer,
            "repetition_penalty": 1.3,
        }
        t = threading.Thread(target=model.generate, kwargs=gen_kwargs, daemon=True)
        t.start()

        t_start = time.monotonic()
        for token in streamer:
            cleaned = _clean_response(token)
            if cleaned:
                q.put({"type": "delta", "delta": cleaned})

        latency_ms = int((time.monotonic() - t_start) * 1000)
        q.put({
            "type": "metadata",
            "metadata": {
                "memorySnapshot": {},
                "narrativeNotesDelta": [],
                "usage": {"inputTokens": int(input_ids.shape[1]), "outputTokens": 0},
                "latencyMs": latency_ms,
                "modelId": request.model_id,
            },
        })
        q.put({"type": "done"})
        q.put(None)
    except Exception as exc:
        print(f"Error en generación:\n{traceback.format_exc()}")
        q.put({"type": "error", "error": str(exc)})
        q.put(None)


# ─── FastAPI ──────────────────────────────────────────────────────────

_CAMEL_RE_1 = re.compile(r"(.)([A-Z][a-z]+)")
_CAMEL_RE_2 = re.compile(r"([a-z0-9])([A-Z])")


def _camel_to_snake(name: str) -> str:
    return _CAMEL_RE_2.sub(r"\1_\2", _CAMEL_RE_1.sub(r"\1_\2", name)).lower()


def _convert_keys(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {_camel_to_snake(k): _convert_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_keys(i) for i in obj]
    return obj


print("Cargando modelo...")
_model, _tokenizer = load_model()

app = FastAPI(title="QuestMasters DM (Pod)")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mode": "pod",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "none",
        "base_only": USE_BASE_MODEL_ONLY,
    }


@app.post("/generate")
async def generate(body: dict[str, Any]) -> StreamingResponse:
    import asyncio

    session_id = body.get("sessionId", body.get("session_id", "?"))
    print(f"[req] session_id={session_id}")

    try:
        snake_body = _convert_keys(body)
        request = DmModelRequest(**snake_body)
    except Exception as exc:
        error = json.dumps({"type": "error", "error": f"Input invalido: {exc}"})
        return StreamingResponse(iter([f"data: {error}\n\n"]), media_type="text/event-stream")

    chunk_queue: queue.Queue = queue.Queue()
    threading.Thread(
        target=_generate_to_queue,
        args=(request, chunk_queue, _model, _tokenizer),
        daemon=True,
    ).start()

    async def stream() -> AsyncGenerator[str, None]:
        while True:
            try:
                item = chunk_queue.get_nowait()
            except queue.Empty:
                yield ": keepalive\n\n"
                await asyncio.sleep(1)
                continue
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
