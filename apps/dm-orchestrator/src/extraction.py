from __future__ import annotations

import json
from typing import Any

from peft import PeftModel
from transformers import PreTrainedTokenizerBase

from src.memory import l2_episodic, l3_semantic

_PROMPT_TEMPLATE = """\
Analiza el siguiente turno y responde SOLO con JSON válido con esta estructura:
{{
  "events": [{{"description": str, "participants": [str], "outcome": str}}],
  "entities": [{{"id": str, "type": str, "name": str, "relations": [{{"target": str, "type": str}}]}}]
}}

Respuesta del DM:
{dm_response}

Input del jugador:
{player_input}

JSON:"""


def _build_prompt(dm_response: str, player_input: str) -> str:
    return _PROMPT_TEMPLATE.format(dm_response=dm_response, player_input=player_input)


def _parse_json(raw: str) -> dict[str, Any]:
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return {"events": [], "entities": []}
    try:
        return json.loads(raw[start:end])
    except json.JSONDecodeError:
        return {"events": [], "entities": []}


def run_extraction(
    model: PeftModel,
    tokenizer: PreTrainedTokenizerBase,
    session_id: str,
    turn: int,
    dm_response: str,
    player_input: str,
) -> dict[str, list]:
    prompt = _build_prompt(dm_response, player_input)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    output_ids = model.generate(**inputs, max_new_tokens=512, do_sample=False)
    raw = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    extracted = _parse_json(raw)

    for event in extracted.get("events", []):
        l2_episodic.save_episode(session_id, turn, "event", event["description"], event)

    if extracted.get("entities"):
        l3_semantic.update_from_extraction(session_id, extracted["entities"])

    return extracted
