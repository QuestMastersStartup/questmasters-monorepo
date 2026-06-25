from __future__ import annotations

import logging
import re
from typing import Any, TypedDict

from src.blackboard import Blackboard
from src.groq_client import groq_json

log = logging.getLogger(__name__)


class RouteDecision(TypedDict):
    needs_memory: bool
    needs_arbiter: bool
    needs_npc: bool
    needs_world: bool


_CLASSIFIER_SYSTEM = (
    "Eres un clasificador de intenciones para una mesa de D&D 5e. "
    "Dado el input del jugador y el contexto de la campaña, determina qué agentes "
    "necesitan participar en este turno.\n\n"
    "Los agentes son:\n"
    "- memory: recuperar recuerdos de turnos anteriores (PNJs conocidos, eventos pasados, "
    "lugares visitados). Necesario cuando se referencia algo del pasado o cuando hay "
    "suficiente historial para dar contexto.\n"
    "- arbiter: consultar reglas del SRD de D&D 5e. Necesario cuando la acción requiere "
    "tirada de dado, involucra combate, magia, habilidades, o cuando hay algo ilógico "
    "para el setting (tecnología moderna en mundo medieval, etc.).\n"
    "- npc: generar reacciones de personajes no jugadores. Necesario cuando el jugador "
    "interactúa con alguien, habla, negocia, amenaza, o cuando hay PNJs presentes que "
    "reaccionarían a la acción.\n"
    "- world: registrar cambios en el mundo. Necesario cuando la acción altera el entorno "
    "(destrucción, robo, muerte, viaje, paso del tiempo, eventos importantes).\n\n"
    "Responde SOLO con JSON válido, sin explicación:\n"
    '{"needs_memory": bool, "needs_arbiter": bool, "needs_npc": bool, "needs_world": bool}'
)

_MIN_TURNS_FOR_AUTO_MEMORY = 3

# ── Fallback por keywords (si Groq falla) ───────────────────────

_ARBITER_KW = {
    "ataco", "atacar", "golpeo", "lanzo", "lanzar", "disparo", "hechizo",
    "conjuro", "magia", "intento", "intentar", "escalo", "salto", "nado",
    "fuerzo", "empujo", "trepo", "escondo", "examino", "investigo", "busco",
    "tirada", "dado", "teléfono", "celular", "pistola", "computadora",
}
_NPC_KW = {
    "hablo", "hablar", "digo", "decir", "pregunto", "preguntar",
    "convenzo", "persuado", "intimido", "engaño", "negocio", "amenazo",
    "saludo", "pido", "le digo", "le pregunto", "respondo", "converso",
}
_WORLD_KW = {
    "destruyo", "destruir", "incendio", "quemo", "rompo", "mato",
    "robo", "saqueo", "viajo", "camino", "corro", "huyo", "escapo",
    "salgo", "entro", "exploro", "espero", "descanso", "duermo",
    "construyo", "reparo",
}
_MEMORY_KW = {
    "recuerdo", "antes", "previamente", "mencionó", "dijo", "hizo",
    "anterior", "la vez que", "cuando", "aquella vez",
}


def _normalize(text: str) -> str:
    return re.sub(r"[^\w\sáéíóúñü]", "", text.lower())


def _has_match(text: str, keywords: set[str]) -> bool:
    normalized = _normalize(text)
    return any(kw in normalized for kw in keywords)


def _fallback_route(player_input: str, turn_count: int) -> RouteDecision:
    log.info("[router] Usando fallback por keywords")
    return RouteDecision(
        needs_memory=(
            turn_count >= _MIN_TURNS_FOR_AUTO_MEMORY
            or _has_match(player_input, _MEMORY_KW)
        ),
        needs_arbiter=_has_match(player_input, _ARBITER_KW),
        needs_npc=_has_match(player_input, _NPC_KW),
        needs_world=_has_match(player_input, _WORLD_KW),
    )


# ── Clasificación con Groq ──────────────────────────────────────

def _groq_route(player_input: str, campaign: str, turn_count: int) -> RouteDecision:
    user_prompt = (
        f"Campaña: {campaign}\n"
        f"Turno actual: {turn_count}\n"
        f"Input del jugador: {player_input}"
    )

    result = groq_json(
        system_prompt=_CLASSIFIER_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.0,
        max_tokens=64,
    )

    if not result:
        return _fallback_route(player_input, turn_count)

    return RouteDecision(
        needs_memory=bool(result.get("needs_memory", turn_count >= _MIN_TURNS_FOR_AUTO_MEMORY)),
        needs_arbiter=bool(result.get("needs_arbiter", False)),
        needs_npc=bool(result.get("needs_npc", False)),
        needs_world=bool(result.get("needs_world", False)),
    )


def route(blackboard: Blackboard) -> RouteDecision:
    player_input = blackboard.get("player_input", "")
    campaign = blackboard.get("campaign_prompt", "")
    turn_count = len(blackboard.get("conversation_history", []))

    try:
        return _groq_route(player_input, campaign, turn_count)
    except Exception as exc:
        log.warning("[router] Groq falló (%s), usando fallback", exc)
        return _fallback_route(player_input, turn_count)


def run_router(
    blackboard: Blackboard,
    pre_computed: dict | None = None,
) -> dict[str, Any]:
    if pre_computed:
        decision = RouteDecision(
            needs_memory=bool(pre_computed.get("needs_memory", False)),
            needs_arbiter=bool(pre_computed.get("needs_arbiter", False)),
            needs_npc=bool(pre_computed.get("needs_npc", False)),
            needs_world=bool(pre_computed.get("needs_world", False)),
        )
        log.info("[router] Usando ruta pre-computada (Workers AI)")
    else:
        decision = route(blackboard)
        log.info("[router] Groq → keywords fallback")

    log.info(
        "[router] memory=%s arbiter=%s npc=%s world=%s",
        decision["needs_memory"],
        decision["needs_arbiter"],
        decision["needs_npc"],
        decision["needs_world"],
    )
    return {"route_decision": decision}
