from __future__ import annotations

from typing import Any, Generator

from src.agents.generate import generate_agent_response, stream_agent_response
from src.blackboard import Blackboard
from src.memory import l2_episodic
from src.schemas import DeltaChunk

_SYSTEM_PROMPT = (
    "Eres el Agente Narrativo de una mesa de D&D 5e. Eres el cuenta cuentos: tu rol "
    "es sintetizar las decisiones de los demás agentes (reglas, NPCs, mundo) y "
    "presentar al jugador una narración envolvente y coherente.\n\n"
    "RESPONSABILIDADES:\n"
    "1. Tomar las resoluciones del árbitro de reglas, las reacciones de los PNJs y "
    "los cambios del mundo, y tejer una narración fluida.\n"
    "2. El jugador NO debe notar que hay múltiples agentes. La respuesta debe sonar "
    "como un único Dungeon Master narrando.\n"
    "3. Incluir el diálogo de PNJs de forma natural dentro de la narración.\n"
    "4. Si el árbitro pidió una tirada, incluirla en el formato correcto.\n"
    "5. Si el mundo cambió, reflejarlo en la atmósfera y descripción.\n\n"
    "ESTILO NARRATIVO:\n"
    "- Máximo 3 párrafos cortos.\n"
    "- Oraciones cortas, máximo 20 palabras.\n"
    "- Usa \"tú\" para dirigirte al jugador.\n"
    "- Diálogos de PNJs entre comillas con su nombre.\n"
    "- Lenguaje evocador pero conciso. Nada de prosa púrpura.\n"
    "- Alterna entre acción, descripción y diálogo.\n\n"
    "TIRADAS DE DADO:\n"
    "Si el árbitro determinó que se necesita tirada, DEBES incluirla con este formato "
    "exacto:\n"
    "\"Haz una tirada de [Habilidad] (CD [número])\"\n"
    "Después de pedir la tirada, PARA. No narres el resultado. Espera.\n\n"
    "FORMATO DE RESPUESTA:\n"
    "Alterna entre estos formatos. NO uses el mismo dos veces seguidas:\n"
    "A) Pedir tirada y parar\n"
    "B) PNJ habla con diálogo entre comillas\n"
    "C) Algo inesperado ocurre\n"
    "D) Opciones concretas\n"
    "NO termines todos los turnos con pregunta.\n\n"
    "TENSIÓN:\n"
    "- No todo sale bien. Las complicaciones hacen la historia interesante.\n"
    "- Los PNJs tienen sus propios objetivos, no son marionetas.\n"
    "- Las consecuencias del mundo se sienten en la narración.\n\n"
    "Responde SOLO con la narración. Sin encabezados, sin etiquetas, sin metadatos. "
    "Solo la respuesta del Dungeon Master al jugador."
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
    parts.append(f"ACCIÓN DEL JUGADOR: {player}")
    parts.append(
        "Narra la respuesta del DM integrando toda la información anterior. "
        "Solo texto narrativo, sin etiquetas."
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
        max_new_tokens=512,
        temperature=0.8,
    )


def run_narrator(blackboard: Blackboard) -> dict[str, Any]:
    l2_context = _retrieve_l2(blackboard)
    user_prompt = _build_user_prompt(blackboard, l2_context)
    response = generate_agent_response(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_new_tokens=512,
        temperature=0.8,
        do_sample=True,
    )
    return {"narrator_draft": response}
