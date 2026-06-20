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
_EMBED_DIM = 512
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


async def _embedding_func(texts: list[str]) -> list[list[float]]:
    etok, emod = _get_embed_model()
    inputs = etok(texts, return_tensors="pt", truncation=True, max_length=512, padding=True)
    with torch.no_grad():
        out = emod(**inputs)
    return out.last_hidden_state[:, 0, :].cpu().float().tolist()


def _lightrag_working_dir(session_id: str) -> str:
    path = SESSIONS_DIR / session_id / "lightrag"
    path.mkdir(parents=True, exist_ok=True)
    return str(path)


async def _llm_func(prompt: str, **_kwargs) -> str:
    switch_adapter("monolithic")
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    output_ids = model.generate(**inputs, max_new_tokens=256, do_sample=False)
    prompt_len = inputs["input_ids"].shape[1]
    return tokenizer.decode(output_ids[0][prompt_len:], skip_special_tokens=True)


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


def _insert_turn(session_id: str, player_input: str, dm_response: str) -> None:
    rag = _get_lightrag(session_id)
    if rag is None:
        return
    try:
        text = f"Jugador: {player_input}\nDM: {dm_response}"
        _run_async(rag.ainsert(text))
    except Exception as exc:
        log.warning("[rag] Error al insertar turno: %s", exc)


def _build_prompt(request: DmModelRequest, rag_context: str) -> str:
    history = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in request.conversation_history[-6:]
    )
    characters = ", ".join(c.name for c in request.characters)
    return (
        f"Campana: {request.campaign_prompt}\n"
        f"Personajes: {characters}\n\n"
        f"Contexto:\n{rag_context}\n\n"
        f"Historial reciente:\n{history}\n\n"
        f"Jugador: {request.player_input}\nDM:"
    )


def _stream_generation(prompt: str) -> Generator[DeltaChunk, None, str]:
    switch_adapter("monolithic")
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    kwargs = {**inputs, "max_new_tokens": 512, "temperature": 0.8, "do_sample": True, "streamer": streamer}
    Thread(target=model.generate, kwargs=kwargs, daemon=True).start()

    full = ""
    for token in streamer:
        full += token
        yield DeltaChunk(content=token)
    return full


def run(request: DmModelRequest) -> Generator[SseChunk, None, None]:
    t_start = time.monotonic()
    player_input = request.player_input or ""

    get_model()

    rag_context = _retrieve_context(request.session_id, player_input)
    prompt = _build_prompt(request, rag_context)

    full_response = ""
    for chunk in _stream_generation(prompt):
        full_response += chunk.content
        yield chunk

    _insert_turn(request.session_id, player_input, full_response)

    latency_ms = int((time.monotonic() - t_start) * 1000)
    yield MetadataChunk(
        memory_snapshot=MemorySnapshot(),
        usage=UsageStats(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        latency_ms=latency_ms,
    )
    yield DoneChunk()
