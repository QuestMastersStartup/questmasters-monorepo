from __future__ import annotations

from typing import Any

from src.agents.generate import generate_agent_response
from src.blackboard import Blackboard
from src.memory import l4_procedural

_SYSTEM_PROMPT = (
    "Eres el Agente de Reglas de una mesa de D&D 5e. Tu rol es ser el consultor "
    "directo del SRD (System Reference Document) y garantizar la coherencia lógica "
    "del mundo de juego.\n\n"
    "RESPONSABILIDADES:\n"
    "1. Evaluar si la acción del jugador es válida según las reglas del SRD 5e.\n"
    "2. Determinar si la acción requiere una tirada de dado, y si es así, qué "
    "habilidad y CD (clase de dificultad, entre 8 y 20) corresponde.\n"
    "3. Verificar coherencia lógica del mundo: si la aventura es medieval fantástica, "
    "no pueden existir celulares, armas modernas ni tecnología anacrónica, SALVO que "
    "el contexto de la campaña lo justifique explícitamente.\n"
    "4. Identificar restricciones de clase, raza o nivel que apliquen a la acción.\n"
    "5. Señalar si la acción tendría consecuencias mecánicas (daño, condiciones, etc.).\n\n"
    "LÍMITES LÓGICOS:\n"
    "- Si algo no existe en el setting de la campaña, señálalo como inválido.\n"
    "- Si un jugador intenta algo que su personaje no podría saber o hacer por nivel "
    "o clase, indícalo.\n"
    "- Las leyes de la física fantástica aplican: la magia existe pero tiene reglas.\n"
    "- Los PNJs no pueden ser controlados por el jugador.\n\n"
    "FORMATO DE RESPUESTA:\n"
    "Responde en español, de forma concisa y estructurada:\n"
    "- VALIDEZ: [válida / inválida / parcialmente válida] — razón breve\n"
    "- TIRADA: [no requerida / Habilidad (CD N)] — justificación\n"
    "- COHERENCIA: [coherente / incoherente] — si aplica, qué rompe la lógica\n"
    "- MECÁNICA: efectos mecánicos relevantes (daño, condiciones, ventaja/desventaja)\n"
    "- NOTA: cualquier regla del SRD relevante que el narrador deba considerar"
)


def _build_user_prompt(blackboard: Blackboard) -> str:
    player = blackboard.get("player_input", "")
    campaign = blackboard.get("campaign_prompt", "")
    l1 = blackboard.get("l1_context", "")

    rules = l4_procedural.query_rules(player, n_results=5)
    rules_text = "\n".join(r["content"] for r in rules[:5])

    history = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in blackboard["conversation_history"][-4:]
    )

    parts = [f"CAMPAÑA: {campaign}"]
    if l1:
        parts.append(f"CONTEXTO RECIENTE (L1):\n{l1}")
    if rules_text:
        parts.append(f"REGLAS SRD RELEVANTES (L4):\n{rules_text}")
    if history:
        parts.append(f"HISTORIAL RECIENTE:\n{history}")
    parts.append(f"ACCIÓN DEL JUGADOR: {player}")
    return "\n\n".join(parts)


def run_arbiter(blackboard: Blackboard) -> dict[str, Any]:
    route = blackboard.get("route_decision", {})
    if not route.get("needs_arbiter", True):
        return {"arbiter_ruling": ""}

    user_prompt = _build_user_prompt(blackboard)
    ruling = generate_agent_response(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_new_tokens=256,
        temperature=0.3,
        do_sample=True,
    )
    return {"arbiter_ruling": ruling}
