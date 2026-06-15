"""
Corre este script UNA SOLA VEZ desde un pod de RunPod con el Network Volume adjunto.
Descarga google/gemma-4-26B-A4B-it al volumen compartido para que el endpoint
serverless lo encuentre en /runpod-volume/shared/base_model.

Uso:
    HF_TOKEN=<tu_token> python scripts/download_base_model.py
"""
from __future__ import annotations

import os
from pathlib import Path

from huggingface_hub import snapshot_download

MODEL_ID = "google/gemma-4-26B-A4B-it"
LOCAL_DIR = Path("/runpod-volume/shared/base_model")

hf_token = os.environ.get("HF_TOKEN", "")
if not hf_token:
    raise RuntimeError("HF_TOKEN environment variable is not set")

print(f"Descargando {MODEL_ID} → {LOCAL_DIR}")
snapshot_download(
    repo_id=MODEL_ID,
    local_dir=str(LOCAL_DIR),
    token=hf_token,
)
print("Descarga completada.")
