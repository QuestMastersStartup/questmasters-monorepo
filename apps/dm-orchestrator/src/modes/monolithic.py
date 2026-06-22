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
    if c.subclass:
        header += f", {c.subclass}"
    if c.background:
        header += f", {c.background}"
    lines = [header]
    if c.alignment:
        lines.append(f"  Alignment: {c.alignment}")
    if c.personality_traits:
        lines.append(f"  Personality: {c.personality_traits}")
    if c.skill_proficiencies:
        lines.append(f"  Proficient in: {', '.join(c.skill_proficiencies)}")
    if c.expertise_skills:
        lines.append(f"  Expertise: {', '.join(c.expertise_skills)}")
    if c.jack_of_all_trades:
        lines.append(f"  Jack of All Trades: +{max(1, c.level // 4 + 1)} to non-proficient checks")
    if c.backstory:
        lines.append(f"  Backstory: {c.backstory}")
    return "\n".join(lines)


def _is_opening_turn(request: DmModelRequest) -> bool:
    return not request.player_input and len(request.conversation_history) == 0


_SYSTEM_BASE = (
    "Eres un Dungeon Master de D&D 5e. Responde en español.\n\n"
    "REGLAS:\n"
    "- Máximo 3 párrafos cortos.\n"
    "- Oraciones cortas, máximo 20 palabras.\n"
    "- Usa \"tú\" para el jugador.\n"
    "- Solo los personajes listados abajo. NO inventes más PJs.\n"
    "- Cuando crees un PNJ, dale nombre propio y descripción breve.\n"
    "- Mantén consistencia con PNJs y lugares ya establecidos.\n\n"
    "TIRADAS DE DADO:\n"
    "SIEMPRE pide tirada cuando el jugador intente algo con esfuerzo o riesgo.\n"
    "FORMATO: \"Haz una tirada de [Habilidad] (CD [número])\"\n"
    "NUNCA escribas \"(Sabiduría)\" o \"(Fuerza)\". Escribe \"(CD 12)\" con un número entre 8 y 20.\n"
    "Después de pedir tirada, NO narres el resultado. ESPERA.\n"
    "Ejemplos: Atletismo (CD 12), Percepción (CD 13), Sigilo (CD 14), Persuasión (CD 15), Investigación (CD 10).\n\n"
    "FORMATO DE RESPUESTA:\n"
    "Alterna entre estos formatos. NO uses el mismo dos veces seguidas:\n"
    "A) Pedir tirada y parar\n"
    "B) PNJ habla con diálogo entre comillas\n"
    "C) Algo inesperado ocurre\n"
    "D) Opciones concretas\n"
    "NO termines todos los turnos con pregunta.\n\n"
    "TENSIÓN:\n"
    "- No todo sale bien. Complicaciones, obstáculos, sorpresas.\n"
    "- Los PNJs tienen sus propios objetivos.\n"
    "- Consecuencias reales para las acciones del jugador."
)

_OPENING_EXTRA = (
    "\nESCENA INICIAL:\n"
    "1. Describe el lugar en 2-3 oraciones cortas.\n"
    "2. Describe por qué el personaje está ahí en 1-2 oraciones.\n"
    "3. Presenta UN evento o persona que llame la atención. Dale nombre y descripción.\n"
    "4. Pregunta qué hace el jugador."
)

_TURN_EXTRA = (
    "\nRESPONDE al jugador siguiendo EXACTAMENTE estas reglas:\n\n"
    "REGLA 1 — TIRADAS: Si la acción necesita esfuerzo físico, mental o social, pide tirada ANTES de narrar resultado.\n"
    "FORMATO OBLIGATORIO: \"Haz una tirada de [Habilidad] (CD [número])\"\n"
    "NO uses \"(Sabiduría)\" ni \"(Fuerza)\". USA \"(CD 12)\" con un número.\n"
    "Después de pedir la tirada, PARA. No narres qué pasa. Espera el resultado.\n\n"
    "REGLA 2 — NO termines con pregunta si el turno anterior terminó con pregunta.\n\n"
    "REGLA 3 — PNJs hablan con diálogo directo entre comillas.\n\n"
    "EJEMPLOS de respuestas correctas:\n\n"
    "Jugador: \"Empujo los barriles pesados hacia un lado.\"\n"
    "DM: Los barriles son enormes y están pegados al suelo húmedo. Necesitarás fuerza bruta para moverlos.\n"
    "Haz una tirada de Atletismo (CD 12)\n\n"
    "Jugador: \"Examino la trampilla con cuidado buscando trampas.\"\n"
    "DM: Te arrodillas junto a la trampilla oxidada. Notas marcas extrañas en los bordes.\n"
    "Haz una tirada de Investigación (CD 13)\n\n"
    "Jugador: \"Intento convencer a Bram de que me cuente la verdad.\"\n"
    "DM: Bram aparta la mirada nervioso. No quiere hablar de eso.\n"
    "Haz una tirada de Persuasión (CD 14)"
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

    turn_num = _turn_counters.get(request.session_id, 0)
    latency_ms = int((time.monotonic() - t_start) * 1000)
    yield MetadataChunk(
        memory_snapshot=MemorySnapshot(
            rag_context=rag_context,
            turn_count=turn_num,
        ),
        usage=UsageStats(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        latency_ms=latency_ms,
    )
    yield DoneChunk()
