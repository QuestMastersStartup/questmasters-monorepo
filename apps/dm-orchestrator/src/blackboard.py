from __future__ import annotations

from typing import TypedDict


class Blackboard(TypedDict):
    session_id: str
    campaign_prompt: str
    conversation_history: list[dict]
    player_input: str

    route_decision: dict

    # L1 compartido (una query, todos los agentes lo leen)
    l1_context: str

    # Salidas de agentes intermedios
    arbiter_ruling: str
    npc_responses: list[str]
    world_state: str

    narrator_draft: str

    extracted_events: list[dict]
    extracted_entities: list[dict]

    usage: dict
