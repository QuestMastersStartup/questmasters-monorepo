from __future__ import annotations

from typing import TypedDict


class Blackboard(TypedDict):
    # Identidad de sesión
    session_id: str
    campaign_prompt: str
    conversation_history: list[dict]
    player_input: str

    # Contexto recuperado de memoria (rellenado por memory_agent)
    l2_context: list[dict]
    l3_context: list[dict]
    l4_context: list[dict]

    # Salidas de agentes intermedios
    arbiter_ruling: str
    npc_responses: list[str]

    # Respuesta final del Narrador
    narrator_draft: str

    # Extracción post-turno
    extracted_events: list[dict]
    extracted_entities: list[dict]

    # Métricas
    usage: dict
