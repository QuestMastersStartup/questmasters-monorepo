"""
Descarga el modelo base y todos los LoRAs según DM_MODE.

Uso:
    RunPod (default):  HF_TOKEN=<token> python scripts/download_base_model.py
    Local (E4B):       DM_MODE=local HF_TOKEN=<token> python scripts/download_base_model.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from huggingface_hub import snapshot_download

from src.config import BASE_MODEL_ID, BASE_MODEL_LOCAL, HF_TOKEN, LORA_BASE_PATH, LORA_REPOS, MODE

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable is not set")


def download_base_model() -> None:
    if BASE_MODEL_LOCAL.exists() and any(BASE_MODEL_LOCAL.iterdir()):
        print(f"Modelo base ya existe en {BASE_MODEL_LOCAL}, saltando.")
        return
    BASE_MODEL_LOCAL.mkdir(parents=True, exist_ok=True)
    print(f"Descargando modelo base {BASE_MODEL_ID} -> {BASE_MODEL_LOCAL}")
    snapshot_download(repo_id=BASE_MODEL_ID, local_dir=str(BASE_MODEL_LOCAL), token=HF_TOKEN)
    print("Modelo base descargado.")


def download_loras() -> None:
    for name, repo_id in LORA_REPOS.items():
        local_dir = LORA_BASE_PATH / name
        if local_dir.exists() and any(local_dir.iterdir()):
            print(f"LoRA '{name}' ya existe, saltando.")
            continue
        local_dir.mkdir(parents=True, exist_ok=True)
        print(f"Descargando LoRA '{name}' desde {repo_id} -> {local_dir}")
        snapshot_download(repo_id=repo_id, local_dir=str(local_dir), token=HF_TOKEN)
        print(f"LoRA '{name}' descargado.")


if __name__ == "__main__":
    print(f"DM_MODE={MODE} | Modelo base: {BASE_MODEL_ID}")
    download_base_model()
    download_loras()
    print("\nTodo listo.")
