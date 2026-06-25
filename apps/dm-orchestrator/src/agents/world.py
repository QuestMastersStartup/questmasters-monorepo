from __future__ import annotations

from typing import Any

from src.agents.generate import generate_agent_response
from src.blackboard import Blackboard
from src.memory import l2_episodic, l3_semantic

_SYSTEM_PROMPT = (
    "Eres el Agente del Mundo de una mesa de D&D 5e. Tu rol es registrar los cambios "
    "importantes que ocurren en el mundo de juego y determinar cómo repercuten en los "
    "PNJs, lugares y facciones.\n\n"
    "RESPONSABILIDADES:\n"
    "1. Identificar si la acción del jugador o la situación actual provocan un cambio "
    "significativo en el estado del mundo (un incendio, una muerte, un pacto, una "
    "alarma, un cambio político, etc.).\n"
    "2. Determinar las REPERCUSIONES de ese cambio: qué PNJs se ven afectados, cómo "
    "cambian sus actitudes, qué lugares se alteran, qué facciones reaccionan.\n"
    "3. Registrar CONSECUENCIAS A FUTURO: si el jugador robó al mercader, los guardias "
    "lo buscarán; si salvó al aldeano, la aldea lo recordará.\n"
    "4. Mantener la CAUSALIDAD del mundo: las acciones tienen efectos dominó lógicos.\n\n"
    "PRINCIPIOS:\n"
    "- El mundo es persistente. Lo que cambia, permanece cambiado.\n"
    "- Los PNJs reaccionan a los eventos del mundo, no solo al jugador directamente.\n"
    "- El paso del tiempo importa: las heridas se curan, los rumores se esparcen, "
    "las patrullas cambian de ruta.\n"
    "- No todos los cambios son inmediatos. Algunos tardan turnos o días en manifestarse.\n"
    "- Si no hay cambio significativo en este turno, indícalo brevemente.\n\n"
    "FORMATO DE RESPUESTA:\n"
    "Responde en español, de forma concisa:\n"
    "- EVENTO: qué cambió en el mundo (o \"Sin cambios significativos\")\n"
    "- AFECTADOS: qué PNJs, lugares o facciones se ven impactados\n"
    "- REPERCUSIÓN INMEDIATA: qué efecto tiene ahora mismo\n"
    "- REPERCUSIÓN FUTURA: qué podría pasar más adelante como consecuencia\n"
    "- AMBIENTE: cómo cambia el tono o la atmósfera de la escena"
)


def _retrieve_l2(blackboard: Blackboard) -> list[dict]:
    query = blackboard.get("player_input", "")
    return l2_episodic.retrieve_relevant_episodes(
        blackboard["session_id"], query, n_results=5,
    )


def _retrieve_l3(blackboard: Blackboard) -> list[dict]:
    graph = l3_semantic.load_graph(blackboard["session_id"])
    last_message = (
        blackboard["conversation_history"] or [{}]
    )[-1].get("content", "")
    relevant_ids = [
        n for n in graph.nodes()
        if n.lower() in last_message.lower()
    ][:3]
    context: list[dict] = []
    for entity_id in relevant_ids:
        context.extend(l3_semantic.query_neighbors(graph, entity_id, depth=1))
    return context


def _build_user_prompt(
    blackboard: Blackboard,
    l2_context: list[dict],
    l3_context: list[dict],
) -> str:
    player = blackboard.get("player_input", "")
    campaign = blackboard.get("campaign_prompt", "")
    arbiter = blackboard.get("arbiter_ruling", "")
    npc_responses = "\n".join(blackboard.get("npc_responses", []))
    l1 = blackboard.get("l1_context", "")

    l2_text = "\n".join(ep["content"] for ep in l2_context[:3])

    entities = []
    for entity in l3_context:
        name = entity.get("name", "?")
        etype = entity.get("type", "?")
        entities.append(f"- [{etype}] {name}")

    history = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in blackboard["conversation_history"][-4:]
    )

    parts = [f"CAMPAÑA: {campaign}"]
    if l1:
        parts.append(f"CONTEXTO RECIENTE (L1):\n{l1}")
    if l2_text:
        parts.append(f"EVENTOS PREVIOS (L2):\n{l2_text}")
    if entities:
        parts.append("ENTIDADES CONOCIDAS (L3):\n" + "\n".join(entities))
    if arbiter:
        parts.append(f"RESOLUCIÓN DEL ÁRBITRO:\n{arbiter}")
    if npc_responses:
        parts.append(f"REACCIONES DE PNJs:\n{npc_responses}")
    if history:
        parts.append(f"HISTORIAL RECIENTE:\n{history}")
    parts.append(f"ACCIÓN DEL JUGADOR: {player}")
    return "\n\n".join(parts)


def run_world(blackboard: Blackboard) -> dict[str, Any]:
    route = blackboard.get("route_decision", {})
    if not route.get("needs_world", True):
        return {"world_state": ""}

    l2_context = _retrieve_l2(blackboard)
    l3_context = _retrieve_l3(blackboard)

    user_prompt = _build_user_prompt(blackboard, l2_context, l3_context)
    response = generate_agent_response(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_new_tokens=300,
        temperature=0.5,
        do_sample=True,
    )
    return {"world_state": response}
