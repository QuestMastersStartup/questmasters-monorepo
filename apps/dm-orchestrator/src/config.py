from __future__ import annotations

import os
from pathlib import Path

MODE = os.environ.get("DM_MODE", "runpod")
HF_TOKEN = os.environ.get("HF_TOKEN", "")

if MODE == "local":
    BASE_MODEL_ID = "google/gemma-4-e4b-it"
    BASE_MODEL_LOCAL = Path.home() / ".cache" / "questmasters" / "base_model"
    LORA_BASE_PATH = Path.home() / ".cache" / "questmasters" / "lora_weights"
    SESSIONS_DIR = Path.home() / ".cache" / "questmasters" / "sessions"
    LORA_REPOS: dict[str, str] = {
        "narrator": "Questmasters/e4b_narrador",
        "arbiter": "Questmasters/e4b_reglas",
        "npc": "Questmasters/e4b_npc",
        "state": "Questmasters/e4b_estado",
        "monolithic": "Questmasters/e4b_monolitico",
    }
else:
    BASE_MODEL_ID = "google/gemma-4-26B-A4B-it"
    BASE_MODEL_LOCAL = Path("/runpod-volume/shared/base_model")
    LORA_BASE_PATH = Path("/runpod-volume/shared/lora_weights")
    SESSIONS_DIR = Path("/runpod-volume/sessions")
    LORA_REPOS = {
        "narrator": "Questmasters/lora_narrador",
        "arbiter": "Questmasters/lora_reglas",
        "npc": "Questmasters/lora_npc",
        "state": "Questmasters/lora_estado",
        "monolithic": "Questmasters/qlora_monolitico",
    }
