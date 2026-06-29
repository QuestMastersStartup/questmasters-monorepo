from __future__ import annotations

from typing import Any, Generator

from src.agents.generate import generate_agent_response, stream_agent_response
from src.blackboard import Blackboard
from src.memory import l2_episodic
from src.schemas import DeltaChunk

_SYSTEM_PROMPT = (
    "Eres un Dungeon Master narrando una partida de D&D 5e en español.\n"
    "SIEMPRE respondes con narración en segunda persona (tú): describes lo que "
    "el jugador ve, oye, huele y siente. NUNCA hables como asistente.\n"
    "Sé conciso: 1-2 párrafos cortos por turno, no más.\n"
    "Diálogos de PNJs entre comillas con su nombre.\n"
    "Cuando el árbitro indica que se necesita tirada, DEBES incluirla con el "
    "formato exacto: 'Haz una tirada de [Habilidad] (CD [N])' para habilidades, "
    "o 'Haz una tirada de salvación de [Característica] (CD [N])' para salvaciones. "
    "NUNCA pidas tirada de Iniciativa ni tirada de Ataque: el combate se resuelve "
    "narrativamente o con tiradas de habilidad (Atletismo, Acrobacias, Sigilo, etc.).\n"
    "Solo narración, sin encabezados ni metadatos."
)


def _retrieve_l2(blackboard: Blackboard) -> list[dict]:
    query = blackboard.get("player_input", "")
    return l2_episodic.retrieve_relevant_episodes(
        blackboard["session_id"], query, n_results=5,
    )


def _build_user_prompt(
    blackboard: Blackboard,
    l2_context: list[dict],
) -> str:
    player = blackboard.get("player_input", "")
    campaign = blackboard.get("campaign_prompt", "")
    arbiter = blackboard.get("arbiter_ruling", "")
    npc_responses = "\n".join(blackboard.get("npc_responses", []))
    world_state = blackboard.get("world_state", "")
    l1 = blackboard.get("l1_context", "")

    l2_text = "\n".join(ep["content"] for ep in l2_context[:3])

    history = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in blackboard["conversation_history"][-6:]
    )

    parts = [f"CAMPAÑA: {campaign}"]
    if l1:
        parts.append(f"CONTEXTO RECIENTE (L1):\n{l1}")
    if l2_text:
        parts.append(f"CONTEXTO EPISÓDICO (L2):\n{l2_text}")
    if arbiter:
        parts.append(f"RESOLUCIÓN DEL ÁRBITRO:\n{arbiter}")
    if npc_responses:
        parts.append(f"REACCIONES DE PNJs:\n{npc_responses}")
    if world_state:
        parts.append(f"ESTADO DEL MUNDO:\n{world_state}")
    if history:
        parts.append(f"HISTORIAL RECIENTE:\n{history}")
    if player:
        parts.append(f"ACCIÓN DEL JUGADOR: {player}")
        parts.append("Narra lo que ocurre. Solo texto narrativo.")
    else:
        parts.append(
            "PRIMER TURNO: No hay acción del jugador. "
            "Describe la escena inicial: dónde está el jugador, qué ve, qué oye, "
            "qué huele. Presenta un PNJ o evento que llame la atención."
        )
    return "\n\n".join(parts)


def stream_narrator(
    blackboard: Blackboard,
) -> Generator[DeltaChunk, None, str]:
    l2_context = _retrieve_l2(blackboard)
    user_prompt = _build_user_prompt(blackboard, l2_context)
    return stream_agent_response(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_new_tokens=320,
        temperature=0.8,
    )


def run_narrator(blackboard: Blackboard) -> dict[str, Any]:
    l2_context = _retrieve_l2(blackboard)
    user_prompt = _build_user_prompt(blackboard, l2_context)
    response = generate_agent_response(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_new_tokens=320,
        temperature=0.8,
        do_sample=True,
    )
    return {"narrator_draft": response}
