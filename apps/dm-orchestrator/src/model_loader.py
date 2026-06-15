from __future__ import annotations

import os
from pathlib import Path
from threading import Lock

import torch
from huggingface_hub import snapshot_download
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, PreTrainedTokenizerBase

_BASE_MODEL_PATH = Path("/runpod-volume/shared/base_model")
_LORA_BASE_PATH = Path("/runpod-volume/shared/lora_weights")
_HF_TOKEN = os.environ["HF_TOKEN"]

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
        if not local_dir.exists():
            snapshot_download(
                repo_id=repo_id,
                local_dir=str(local_dir),
                token=_HF_TOKEN,
            )


def _load_model_and_adapters() -> tuple[PeftModel, PreTrainedTokenizerBase]:
    download_lora_weights()

    base = AutoModelForCausalLM.from_pretrained(
        str(_BASE_MODEL_PATH),
        load_in_8bit=True,
        device_map="auto",
        torch_dtype=torch.float16,
    )
    tokenizer = AutoTokenizer.from_pretrained(str(_BASE_MODEL_PATH))

    # Cargar primer adapter y luego añadir el resto
    first_name, *rest_names = list(_LORA_REPOS.keys())
    model = PeftModel.from_pretrained(
        base,
        str(_LORA_BASE_PATH / first_name),
        adapter_name=first_name,
    )
    for name in rest_names:
        model.load_adapter(str(_LORA_BASE_PATH / name), adapter_name=name)

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
