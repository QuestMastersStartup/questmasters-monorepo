"""
Corre este script UNA SOLA VEZ desde un pod de RunPod con el Network Volume adjunto.
Descarga el modelo base y todos los LoRAs al volumen compartido.

Uso:
    HF_TOKEN=<tu_token> python scripts/download_base_model.py
"""
from __future__ import annotations

import os
from pathlib import Path

from huggingface_hub import snapshot_download

HF_TOKEN = os.environ.get("HF_TOKEN", "")
if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN environment variable is not set")

BASE_MODEL_ID = "google/gemma-4-26B-A4B-it"
BASE_MODEL_DIR = Path("/runpod-volume/shared/base_model")

LORA_REPOS: dict[str, str] = {
    "narrator": "Questmasters/lora_narrador",
    "arbiter": "Questmasters/lora_reglas",
    "npc": "Questmasters/lora_npc",
    "state": "Questmasters/lora_estado",
    "monolithic": "Questmasters/qlora_monolitico",
}
LORA_BASE_DIR = Path("/runpod-volume/shared/lora_weights")


def download_base_model() -> None:
    if BASE_MODEL_DIR.exists() and any(BASE_MODEL_DIR.iterdir()):
        print(f"Modelo base ya existe en {BASE_MODEL_DIR}, saltando.")
        return
    print(f"Descargando modelo base {BASE_MODEL_ID} → {BASE_MODEL_DIR}")
    snapshot_download(repo_id=BASE_MODEL_ID, local_dir=str(BASE_MODEL_DIR), token=HF_TOKEN)
    print("Modelo base descargado.")


def download_loras() -> None:
    for name, repo_id in LORA_REPOS.items():
        local_dir = LORA_BASE_DIR / name
        if local_dir.exists() and any(local_dir.iterdir()):
            print(f"LoRA '{name}' ya existe, saltando.")
            continue
        print(f"Descargando LoRA '{name}' desde {repo_id} → {local_dir}")
        snapshot_download(repo_id=repo_id, local_dir=str(local_dir), token=HF_TOKEN)
        print(f"LoRA '{name}' descargado.")


if __name__ == "__main__":
    download_base_model()
    download_loras()
    print("\nTodo listo. Podés apagar el pod.")
