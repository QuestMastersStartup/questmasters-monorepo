from __future__ import annotations

import logging
import os
from pathlib import Path
from threading import Lock

import torch
from huggingface_hub import snapshot_download
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, PreTrainedTokenizerBase

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger(__name__)

_BASE_MODEL_ID = "google/gemma-4-26B-A4B-it"
_LORA_BASE_PATH = Path("/runpod-volume/shared/lora_weights")
_HF_TOKEN = os.environ.get("HF_TOKEN", "")
if not _HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable is not set")

_LORA_REPOS: dict[str, str] = {
    "narrator": "Questmasters/lora_narrador",
    "arbiter": "Questmasters/lora_reglas",
    "npc": "Questmasters/lora_npc",
    "state": "Questmasters/lora_estado",
    "monolithic": "Questmasters/qlora_monolitico",
}

_model: PeftModel | None = None
_tokenizer: PreTrainedTokenizerBase | None = None
_lock = Lock()


def download_lora_weights() -> None:
    for adapter_name, repo_id in _LORA_REPOS.items():
        local_dir = _LORA_BASE_PATH / adapter_name
        if local_dir.exists():
            log.info("LoRA '%s' already cached, skipping download", adapter_name)
            continue
        log.info("Downloading LoRA '%s' from %s ...", adapter_name, repo_id)
        snapshot_download(repo_id=repo_id, local_dir=str(local_dir), token=_HF_TOKEN)
        log.info("LoRA '%s' downloaded", adapter_name)


def _load_model_and_adapters() -> tuple[PeftModel, PreTrainedTokenizerBase]:
    log.info("torch %s | CUDA available: %s", torch.__version__, torch.cuda.is_available())

    download_lora_weights()

    log.info("Loading base model %s (8-bit) ...", _BASE_MODEL_ID)
    bnb_config = BitsAndBytesConfig(load_in_8bit=True)
    base = AutoModelForCausalLM.from_pretrained(
        _BASE_MODEL_ID,
        token=_HF_TOKEN,
        quantization_config=bnb_config,
        device_map="auto",
    )
    log.info("Base model loaded")

    log.info("Loading tokenizer ...")
    tokenizer = AutoTokenizer.from_pretrained(_BASE_MODEL_ID, token=_HF_TOKEN)
    log.info("Tokenizer loaded")

    first_name, *rest_names = list(_LORA_REPOS.keys())
    log.info("Attaching LoRA adapter '%s' ...", first_name)
    model = PeftModel.from_pretrained(base, str(_LORA_BASE_PATH / first_name), adapter_name=first_name)
    for name in rest_names:
        log.info("Attaching LoRA adapter '%s' ...", name)
        model.load_adapter(str(_LORA_BASE_PATH / name), adapter_name=name)

    log.info("All adapters loaded — model ready")
    return model, tokenizer


def get_model() -> PeftModel:
    global _model, _tokenizer
    if _model is None:
        with _lock:
            if _model is None:
                _model, _tokenizer = _load_model_and_adapters()
    return _model


def get_tokenizer() -> PreTrainedTokenizerBase:
    if _tokenizer is None:
        get_model()
    return _tokenizer  # type: ignore[return-value]


def switch_adapter(name: str) -> None:
    """Cambia el LoRA activo. Llamar antes de cada generate() en modo MAS."""
    get_model().set_adapter(name)
