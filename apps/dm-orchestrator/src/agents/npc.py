from __future__ import annotations

from typing import Any

from src.blackboard import Blackboard
from src.model_loader import get_model, get_tokenizer, switch_adapter

def _build_npc_prompt(npc: dict, player_input: str) -> str:
    name = npc.get("name", "NPC")
    personality = npc.get("personality", "neutral")
    return f"NPC: {name}\nPersonalidad: {personality}\nJugador dice: {player_input}\n{name}:"


def _generate_one(npc: dict, player_input: str) -> str:
    model = get_model()
    tokenizer = get_tokenizer()
    prompt = _build_npc_prompt(npc, player_input)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    output_ids = model.generate(**inputs, max_new_tokens=128, temperature=0.9, do_sample=True)
    prompt_len = inputs["input_ids"].shape[1]
    text = tokenizer.decode(output_ids[0][prompt_len:], skip_special_tokens=True)
    return f"{npc.get('name', 'NPC')}: {text.strip()}"


def run_npc(blackboard: Blackboard) -> dict[str, Any]:
    switch_adapter("npc")
    npcs = [e for e in blackboard.get("l3_context", []) if e.get("type") == "npc"]
    player_input = blackboard.get("player_input", "")
    responses = [_generate_one(npc, player_input) for npc in npcs[:3]]
    return {"npc_responses": responses}
