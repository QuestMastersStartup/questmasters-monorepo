from __future__ import annotations

from typing import Any

from src.agents.generate import generate_agent_response
from src.blackboard import Blackboard
from src.memory import l2_episodic, l3_semantic

_SYSTEM_PROMPT = (
    "Eres el Agente de NPCs de una mesa de D&D 5e. Tu rol es crear arquetipos de "
    "personajes no jugadores (PNJs) y definir cómo deberían comportarse en cada "
    "situación.\n\n"
    "RESPONSABILIDADES:\n"
    "1. Definir la personalidad, motivaciones y objetivos de cada PNJ presente.\n"
    "2. Determinar cómo reaccionaría cada PNJ ante la acción del jugador, basándote "
    "en su arquetipo y estado emocional actual.\n"
    "3. Generar líneas de diálogo coherentes con la personalidad del PNJ.\n"
    "4. Mantener consistencia: un PNJ cobarde no se vuelve valiente sin razón, "
    "un mercader avaro no regala cosas.\n"
    "5. Si no hay PNJs presentes en la escena, indicar si la acción del jugador "
    "debería atraer la atención de algún PNJ cercano.\n\n"
    "ARQUETIPOS:\n"
    "Cada PNJ tiene: nombre, rol (tabernero, guardia, mendigo, noble...), "
    "personalidad (3 rasgos clave), motivación principal, actitud hacia el jugador "
    "(amigable, neutral, hostil, desconfiado), y un secreto o detalle oculto.\n\n"
    "REGLAS DE COMPORTAMIENTO:\n"
    "- Los PNJs tienen voluntad propia. No obedecen al jugador automáticamente.\n"
    "- Las reacciones deben ser proporcionales: un insulto menor no provoca un duelo.\n"
    "- Los PNJs recuerdan interacciones previas (usa el contexto episódico).\n"
    "- El diálogo debe sonar natural, no expositivo. Frases cortas, con personalidad.\n\n"
    "FORMATO DE RESPUESTA:\n"
    "Responde en español. Para cada PNJ relevante:\n"
    "- NOMBRE: nombre del PNJ\n"
    "- ACTITUD: su disposición actual hacia el jugador\n"
    "- REACCIÓN: qué hace o dice ante la acción del jugador (1-2 oraciones)\n"
    "- DIÁLOGO: línea de diálogo sugerida entre comillas (si habla)\n"
    "- INTENCIÓN: qué quiere lograr el PNJ en este momento"
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
    l1 = blackboard.get("l1_context", "")

    npcs_context = []
    for entity in l3_context:
        if entity.get("type") == "npc":
            name = entity.get("name", "Desconocido")
            personality = entity.get("personality", "sin definir")
            npcs_context.append(f"- {name}: {personality}")

    l2_text = "\n".join(ep["content"] for ep in l2_context[:3])

    history = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in blackboard["conversation_history"][-4:]
    )

    parts = [f"CAMPAÑA: {campaign}"]
    if l1:
        parts.append(f"CONTEXTO RECIENTE (L1):\n{l1}")
    if npcs_context:
        parts.append("PNJs CONOCIDOS (L3):\n" + "\n".join(npcs_context))
    if l2_text:
        parts.append(f"CONTEXTO EPISÓDICO (L2):\n{l2_text}")
    if arbiter:
        parts.append(f"RESOLUCIÓN DEL ÁRBITRO:\n{arbiter}")
    if history:
        parts.append(f"HISTORIAL RECIENTE:\n{history}")
    parts.append(f"ACCIÓN DEL JUGADOR: {player}")
    return "\n\n".join(parts)


def run_npc(blackboard: Blackboard) -> dict[str, Any]:
    route = blackboard.get("route_decision", {})
    if not route.get("needs_npc", True):
        return {"npc_responses": []}

    l2_context = _retrieve_l2(blackboard)
    l3_context = _retrieve_l3(blackboard)

    user_prompt = _build_user_prompt(blackboard, l2_context, l3_context)
    response = generate_agent_response(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_new_tokens=300,
        temperature=0.8,
        do_sample=True,
    )
    return {"npc_responses": [response]}
