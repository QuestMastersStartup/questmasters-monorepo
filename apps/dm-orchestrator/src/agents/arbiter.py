from __future__ import annotations

from typing import Any

from src.blackboard import Blackboard
from src.model_loader import get_model, get_tokenizer, switch_adapter

def _build_prompt(blackboard: Blackboard) -> str:
    rules = "\n".join(r["content"] for r in blackboard.get("l4_context", [])[:3])
    player = blackboard.get("player_input", "")
    return f"Reglas relevantes:\n{rules}\n\nAcción: {player}\nResolución:"


def run_arbiter(blackboard: Blackboard) -> dict[str, Any]:
    switch_adapter("arbiter")
    model = get_model()
    tokenizer = get_tokenizer()
    prompt = _build_prompt(blackboard)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    output_ids = model.generate(**inputs, max_new_tokens=256, do_sample=False)
    prompt_len = inputs["input_ids"].shape[1]
    response = tokenizer.decode(output_ids[0][prompt_len:], skip_special_tokens=True)
    return {"arbiter_ruling": response.strip()}
