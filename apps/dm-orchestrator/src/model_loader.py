from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from threading import Lock

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, PreTrainedModel, PreTrainedTokenizerBase

from src.config import HF_TOKEN, MODE, BASE_MODEL_LOCAL

log = logging.getLogger(__name__)

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable is not set")

MERGED_DIR = Path.home() / ".cache" / "questmasters" / "merged_model"

_model: PreTrainedModel | None = None
_tokenizer: PreTrainedTokenizerBase | None = None
_input_device: torch.device | None = None
_lock = Lock()


def _load_model() -> tuple[PreTrainedModel, PreTrainedTokenizerBase]:
    global _input_device
    t_start = time.monotonic()

    if not MERGED_DIR.exists() or not any(MERGED_DIR.iterdir()):
        raise RuntimeError(
            f"Modelo mergeado no encontrado en {MERGED_DIR}. "
            "Ejecuta primero: docker compose run --rm dm-orchestrator python scripts/merge_lora.py"
        )

    log.info("=" * 60)
    log.info("[init] Cargando modelo mergeado | modo=%s", MODE)
    log.info("[init] Desde: %s", MERGED_DIR)
    log.info("=" * 60)

    if torch.cuda.is_available():
        free_vram, total_vram = torch.cuda.mem_get_info(0)
        log.info(
            "[gpu]  %s | VRAM total=%.1fGB libre=%.1fGB",
            torch.cuda.get_device_name(0),
            total_vram / 1024 ** 3,
            free_vram / 1024 ** 3,
        )

    free_vram_gb = 0.0
    if torch.cuda.is_available():
        free_vram, _ = torch.cuda.mem_get_info(0)
        free_vram_gb = free_vram / 1024 ** 3

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )

    if free_vram_gb >= 12:
        log.info("[1/2] VRAM suficiente (%.1fGB) — float16 en GPU", free_vram_gb)
        model = AutoModelForCausalLM.from_pretrained(
            str(MERGED_DIR),
            torch_dtype=torch.float16,
            device_map={"": 0},
        )
    else:
        log.info("[1/2] VRAM limitada (%.1fGB) — 4-bit NF4 en GPU", free_vram_gb)
        model = AutoModelForCausalLM.from_pretrained(
            str(MERGED_DIR),
            quantization_config=bnb_config,
            device_map={"": 0},
        )
    _input_device = next(model.parameters()).device
    _log_elapsed(t_start, "Modelo cargado")
    log.info("[1/2] Input device: %s", _input_device)

    if torch.cuda.is_available():
        free_vram, _ = torch.cuda.mem_get_info(0)
        log.info("[1/2] VRAM libre tras carga: %.1fGB", free_vram / 1024 ** 3)

    log.info("[2/2] Cargando tokenizer ...")
    tokenizer = AutoTokenizer.from_pretrained(str(MERGED_DIR))
    _log_elapsed(t_start, "Tokenizer cargado")

    log.info("=" * 60)
    log.info("[OK]  Modelo listo en %.1fs", time.monotonic() - t_start)
    log.info("=" * 60)
    return model, tokenizer


def _log_elapsed(t_start: float, msg: str) -> None:
    log.info("[%.1fs] %s", time.monotonic() - t_start, msg)


def get_model() -> PreTrainedModel:
    global _model, _tokenizer
    if _model is None:
        with _lock:
            if _model is None:
                _model, _tokenizer = _load_model()
    return _model


def get_tokenizer() -> PreTrainedTokenizerBase:
    if _tokenizer is None:
        get_model()
    return _tokenizer  # type: ignore[return-value]


def get_input_device() -> torch.device:
    if _input_device is None:
        get_model()
    return _input_device  # type: ignore[return-value]


def switch_adapter(name: str) -> None:
    pass
