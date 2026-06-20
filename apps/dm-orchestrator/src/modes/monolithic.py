from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import os
import time
from pathlib import Path
from threading import Lock, Thread
from typing import Generator

import torch
from transformers import AutoModel, AutoTokenizer, TextIteratorStreamer

from src.config import SESSIONS_DIR
from src.model_loader import get_input_device, get_model, get_tokenizer, switch_adapter
from src.schemas import (
    CharacterSnapshot,
    DeltaChunk,
    DmModelRequest,
    DoneChunk,
    MemorySnapshot,
    MetadataChunk,
    SseChunk,
    UsageStats,
)

log = logging.getLogger(__name__)

_EMBED_MODEL_ID = "BAAI/bge-small-en-v1.5"
_EMBED_DIM = 384
_embed_tok: AutoTokenizer | None = None
_embed_mod: AutoModel | None = None
_embed_lock = Lock()


def _get_embed_model() -> tuple[AutoTokenizer, AutoModel]:
    global _embed_tok, _embed_mod
    if _embed_mod is None:
        with _embed_lock:
            if _embed_mod is None:
                hf_token = os.environ.get("HF_TOKEN", "")
                _embed_tok = AutoTokenizer.from_pretrained(_EMBED_MODEL_ID, token=hf_token)
                _embed_mod = AutoModel.from_pretrained(_EMBED_MODEL_ID, token=hf_token)
                _embed_mod.eval()
    return _embed_tok, _embed_mod  # type: ignore[return-value]


async def _embedding_func(texts: list[str]):
    import numpy as np
    etok, emod = _get_embed_model()
    inputs = etok(texts, return_tensors="pt", truncation=True, max_length=512, padding=True)
    with torch.no_grad():
        out = emod(**inputs)
    return out.last_hidden_state[:, 0, :].cpu().float().numpy()


def _lightrag_working_dir(session_id: str) -> str:
    path = SESSIONS_DIR / session_id / "lightrag"
    path.mkdir(parents=True, exist_ok=True)
    return str(path)


async def _llm_func(prompt: str, **_kwargs) -> str:
    switch_adapter("monolithic")
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()
    messages = [{"role": "user", "content": prompt}]
    input_ids = tokenizer.apply_chat_template(
        messages, return_tensors="pt", add_generation_prompt=True, return_dict=False,
    ).to(device)
    output_ids = model.generate(input_ids=input_ids, max_new_tokens=256, do_sample=False)
    return tokenizer.decode(output_ids[0][input_ids.shape[1]:], skip_special_tokens=True)


_async_executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)


def _run_async(coro) -> object:
    future = _async_executor.submit(asyncio.run, coro)
    return future.result()


def _get_lightrag(session_id: str):
    try:
        from lightrag import LightRAG
        from lightrag.utils import EmbeddingFunc

        embed = EmbeddingFunc(embedding_dim=_EMBED_DIM, max_token_size=512, func=_embedding_func)
        rag = LightRAG(
            working_dir=_lightrag_working_dir(session_id),
            llm_model_func=_llm_func,
            embedding_func=embed,
        )
        _run_async(rag.initialize_storages())
        return rag
    except Exception as exc:
        log.warning("[rag] LightRAG no disponible, continuando sin RAG: %s", exc)
        return None


def _retrieve_context(session_id: str, query: str) -> str:
    working_dir = Path(_lightrag_working_dir(session_id))
    if not any(working_dir.iterdir()):
        return ""
    rag = _get_lightrag(session_id)
    if rag is None:
        return ""
    try:
        return _run_async(rag.aquery(query, param=__import__("lightrag").QueryParam(mode="hybrid")))
    except Exception as exc:
        log.warning("[rag] Error en query, continuando sin contexto: %s", exc)
        return ""


_turn_counters: dict[str, int] = {}


def _insert_turn(
    session_id: str,
    player_input: str,
    dm_response: str,
    characters: list[CharacterSnapshot] | None = None,
) -> None:
    rag = _get_lightrag(session_id)
    if rag is None:
        return
    try:
        turn_num = _turn_counters.get(session_id, 0) + 1
        _turn_counters[session_id] = turn_num
        char_names = ", ".join(c.name for c in characters) if characters else "Jugador"
        text = f"--- Turno {turn_num} ---\nPersonaje jugador: {char_names}\n"
        if player_input:
            text += f"Acción del jugador: {player_input}\n"
        text += f"Narración del DM: {dm_response}\n"
        _run_async(rag.ainsert(text))
        log.info("[rag] Turno %d insertado en memoria", turn_num)
    except Exception as exc:
        log.warning("[rag] Error al insertar turno: %s", exc)


def _format_character(c: CharacterSnapshot) -> str:
    origin = " ".join(filter(None, [f"Level {c.level}" if c.level > 1 else "", c.race, c.class_name]))
    header = f"- {c.name}"
    if origin:
        header += f" ({origin})"
    if c.background:
        header += f", {c.background}"
    lines = [header]
    if c.alignment:
        lines.append(f"  Alignment: {c.alignment}")
    if c.personality_traits:
        lines.append(f"  Personality: {c.personality_traits}")
    if c.backstory:
        lines.append(f"  Backstory: {c.backstory}")
    return "\n".join(lines)


def _is_opening_turn(request: DmModelRequest) -> bool:
    return not request.player_input and len(request.conversation_history) == 0


_SYSTEM_BASE = (
    "Eres un Dungeon Master de D&D 5e. Responde en español.\n\n"
    "REGLAS:\n"
    "- Máximo 3 párrafos cortos por respuesta.\n"
    "- Oraciones cortas. Máximo 20 palabras por oración.\n"
    "- NO inventes palabras raras ni nombres absurdos.\n"
    "- Usa \"tú\" para dirigirte al jugador. NO uses \"vosotros\".\n"
    "- Solo hay los personajes listados abajo. NO inventes más.\n"
    "- Sé concreto: describe lo que el personaje ve, oye y huele.\n"
    "- Cuando crees un PNJ, dale un nombre propio y una descripción breve memorable.\n"
    "- Mantén consistencia con PNJs y lugares ya establecidos.\n"
    "- Termina con una pregunta clara: \"¿Qué haces?\" o similar."
)

_OPENING_EXTRA = (
    "\nESCENA INICIAL:\n"
    "1. Describe el lugar en 2-3 oraciones cortas.\n"
    "2. Describe por qué el personaje está ahí en 1-2 oraciones.\n"
    "3. Presenta UN evento o persona que llame la atención. Dale nombre y descripción.\n"
    "4. Pregunta qué hace el jugador."
)

_TURN_EXTRA = (
    "\n- Responde directamente a lo que el jugador dijo.\n"
    "- Describe lo que pasa en 2-3 oraciones.\n"
    "- Si hay PNJs presentes, úsalos por su nombre.\n"
    "- Pregunta qué hace el jugador."
)


def _build_messages(request: DmModelRequest, rag_context: str) -> list[dict[str, str]]:
    chars_block = "\n".join(_format_character(c) for c in request.characters)

    opening = _is_opening_turn(request)
    extra = _OPENING_EXTRA if opening else _TURN_EXTRA

    system = (
        f"{_SYSTEM_BASE}\n{extra}\n\n"
        f"Campaña: {request.campaign_prompt}\n\n"
        f"Personajes:\n{chars_block}"
    )
    if rag_context:
        system += f"\n\nContexto de turnos anteriores (PNJs, lugares, eventos):\n{rag_context}"

    messages: list[dict[str, str]] = [{"role": "system", "content": system}]

    for turn in request.conversation_history[-6:]:
        role = "user" if turn.get("role") == "player" else "assistant"
        messages.append({"role": role, "content": turn["content"]})

    if request.player_input:
        messages.append({"role": "user", "content": request.player_input})

    return messages


def _stream_generation(
    messages: list[dict[str, str]],
    max_new_tokens: int = 300,
) -> Generator[DeltaChunk, None, str]:
    switch_adapter("monolithic")
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()

    input_ids = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True,
        return_dict=False,
    ).to(device)

    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    gen_kwargs = {
        "input_ids": input_ids,
        "max_new_tokens": max_new_tokens,
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "do_sample": True,
        "repetition_penalty": 1.3,
        "streamer": streamer,
    }
    Thread(target=model.generate, kwargs=gen_kwargs, daemon=True).start()

    full = ""
    for token in streamer:
        full += token
        yield DeltaChunk(content=token)
    return full


def run(request: DmModelRequest) -> Generator[SseChunk, None, None]:
    t_start = time.monotonic()
    player_input = request.player_input or ""
    opening = _is_opening_turn(request)

    get_model()

    rag_context = _retrieve_context(request.session_id, player_input)
    messages = _build_messages(request, rag_context)

    token_limit = 400 if opening else 300
    full_response = ""
    for chunk in _stream_generation(messages, max_new_tokens=token_limit):
        full_response += chunk.content
        yield chunk

    _insert_turn(request.session_id, player_input, full_response, request.characters)

    latency_ms = int((time.monotonic() - t_start) * 1000)
    yield MetadataChunk(
        memory_snapshot=MemorySnapshot(),
        usage=UsageStats(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        latency_ms=latency_ms,
    )
    yield DoneChunk()
