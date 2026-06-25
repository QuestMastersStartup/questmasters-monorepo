from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import os
from pathlib import Path
from threading import Lock
from typing import Any

import torch
from transformers import AutoModel, AutoTokenizer

from src.config import SESSIONS_DIR

log = logging.getLogger(__name__)

_EMBED_MODEL_ID = "BAAI/bge-small-en-v1.5"
_EMBED_DIM = 384

_embed_tok: AutoTokenizer | None = None
_embed_mod: AutoModel | None = None
_embed_lock = Lock()
_async_executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)


def _get_embed_model() -> tuple[AutoTokenizer, AutoModel]:
    global _embed_tok, _embed_mod
    if _embed_mod is None:
        with _embed_lock:
            if _embed_mod is None:
                hf_token = os.environ.get("HF_TOKEN", "")
                _embed_tok = AutoTokenizer.from_pretrained(
                    _EMBED_MODEL_ID, token=hf_token,
                )
                _embed_mod = AutoModel.from_pretrained(
                    _EMBED_MODEL_ID, token=hf_token,
                )
                _embed_mod.eval()
    return _embed_tok, _embed_mod  # type: ignore[return-value]


async def _embedding_func(texts: list[str]) -> Any:
    import numpy as np  # noqa: F811
    etok, emod = _get_embed_model()
    inputs = etok(
        texts, return_tensors="pt",
        truncation=True, max_length=512, padding=True,
    )
    with torch.no_grad():
        out = emod(**inputs)
    return out.last_hidden_state[:, 0, :].cpu().float().numpy()


def _run_async(coro: Any) -> Any:
    future = _async_executor.submit(asyncio.run, coro)
    return future.result()


def _working_dir(session_id: str) -> Path:
    path = SESSIONS_DIR / session_id / "lightrag"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _get_rag(session_id: str, llm_func: Any) -> Any:
    try:
        from lightrag import LightRAG
        from lightrag.utils import EmbeddingFunc

        embed = EmbeddingFunc(
            embedding_dim=_EMBED_DIM,
            max_token_size=512,
            func=_embedding_func,
        )
        rag = LightRAG(
            working_dir=str(_working_dir(session_id)),
            llm_model_func=llm_func,
            embedding_func=embed,
        )
        _run_async(rag.initialize_storages())
        return rag
    except Exception as exc:
        log.warning("[L1] LightRAG no disponible: %s", exc)
        return None


def retrieve(session_id: str, query: str, llm_func: Any) -> str:
    wd = _working_dir(session_id)
    if not any(wd.iterdir()):
        return ""
    rag = _get_rag(session_id, llm_func)
    if rag is None:
        return ""
    try:
        from lightrag import QueryParam
        return _run_async(
            rag.aquery(query, param=QueryParam(mode="hybrid")),
        )
    except Exception as exc:
        log.warning("[L1] Error en query: %s", exc)
        return ""


def insert_turn(
    session_id: str,
    turn: int,
    player_input: str,
    dm_response: str,
    llm_func: Any,
    arbiter_ruling: str = "",
    npc_responses: str = "",
    world_state: str = "",
) -> None:
    rag = _get_rag(session_id, llm_func)
    if rag is None:
        return
    try:
        parts = [f"--- Turno {turn} ---"]
        if player_input:
            parts.append(f"Acción del jugador: {player_input}")
        if arbiter_ruling:
            parts.append(f"Resolución de reglas: {arbiter_ruling}")
        if npc_responses:
            parts.append(f"Reacciones PNJs: {npc_responses}")
        if world_state:
            parts.append(f"Estado del mundo: {world_state}")
        parts.append(f"Narración del DM: {dm_response}")
        _run_async(rag.ainsert("\n".join(parts)))
        log.info("[L1] Turno %d insertado", turn)
    except Exception as exc:
        log.warning("[L1] Error al insertar turno: %s", exc)
