from __future__ import annotations

import re

_MAX_WORDS = 200

_AGENT_HEADERS_RE = re.compile(
    r"^(\*\*)?("
    r"(Como|Soy el|En mi rol de|REPORTE DEL) .{5,80}"
    r"|Agente (de|del) \w+"
    r"|Entendido\..*"
    r")(\*\*)?\s*$",
    re.MULTILINE,
)

# Captura iniciativa y tiradas de ataque — mecánicas no implementadas
_COMBAT_MECHANICS_RE = re.compile(
    r"[Hh]az una tirada de (?:[Ii]niciativa|[Aa]taque[^.]*)[^.]*\.?",
)

_DICE_RE = re.compile(
    r"[Hh]az una tirada de .+?\(CD \d+\)",
)

_META_PHRASES = [
    "estoy listo", "proporcióname", "proporcioname",
    "espero tu", "dame los detalles", "necesito que me",
    "procesando tu", "lanzaré la escena", "dime qué",
    "cuéntame más", "indícame", "preparado para",
]


def is_meta_response(text: str) -> bool:
    lower = text.lower()
    return any(phrase in lower for phrase in _META_PHRASES)


def _truncate_to_last_sentence(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text

    truncated = " ".join(words[:max_words])

    # Si hay una tirada de dado, preservarla completa aunque pase el límite
    dice_match = _DICE_RE.search(text)
    if dice_match and dice_match.start() > len(truncated):
        dice_end = dice_match.end()
        after_dice = text[dice_end:].split(".")[0]
        return (text[:dice_end] + after_dice).rstrip(" ,;:") + "."

    for sep in [".", "!", "?"]:
        pos = truncated.rfind(sep)
        if pos > len(truncated) // 3:
            return truncated[: pos + 1]

    return truncated.rstrip(" ,;:") + "."


def clean_narrator_response(text: str) -> str:
    text = _AGENT_HEADERS_RE.sub("", text)
    text = _COMBAT_MECHANICS_RE.sub("", text)
    text = _truncate_to_last_sentence(text, _MAX_WORDS)
    return text.strip()


def clean_agent_response(text: str) -> str:
    text = _AGENT_HEADERS_RE.sub("", text)
    return text.strip()
