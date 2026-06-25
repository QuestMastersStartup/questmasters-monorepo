from __future__ import annotations

import itertools
import json
import logging
import os
from threading import Lock
from typing import Any

import httpx

log = logging.getLogger(__name__)

_GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "llama-3.1-8b-instant"
_TIMEOUT = 10.0

_keys: list[str] = []
_key_cycle: itertools.cycle[str] | None = None
_lock = Lock()


def _load_keys() -> list[str]:
    global _keys, _key_cycle
    if _keys:
        return _keys

    with _lock:
        if _keys:
            return _keys

        raw = os.environ.get("GROQ_API_KEYS", "")
        if raw:
            _keys = [k.strip() for k in raw.split(",") if k.strip()]

        single = os.environ.get("GROQ_API_KEY", "")
        if single and single not in _keys:
            _keys.append(single)

        if not _keys:
            log.warning("[groq] No se encontraron GROQ_API_KEYS ni GROQ_API_KEY")

        _key_cycle = itertools.cycle(_keys)
    return _keys


def _next_key() -> str:
    global _key_cycle
    _load_keys()
    if _key_cycle is None:
        raise RuntimeError("No hay API keys de Groq configuradas")
    with _lock:
        return next(_key_cycle)


def groq_chat(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.0,
    max_tokens: int = 256,
) -> str:
    keys = _load_keys()
    attempts = len(keys) if keys else 1

    for attempt in range(attempts):
        api_key = _next_key()
        try:
            response = httpx.post(
                _GROQ_BASE_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=_TIMEOUT,
            )

            if response.status_code == 429:
                key_hint = api_key[:8]
                log.warning("[groq] Rate limit con key %s***, rotando", key_hint)
                continue

            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

        except httpx.TimeoutException:
            log.warning("[groq] Timeout intento %d/%d", attempt + 1, attempts)
            continue
        except httpx.HTTPStatusError as exc:
            log.warning("[groq] HTTP %d intento %d/%d", exc.response.status_code, attempt + 1, attempts)
            continue

    raise RuntimeError("Todas las API keys de Groq fallaron o están rate-limited")


def groq_json(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.0,
    max_tokens: int = 256,
) -> dict[str, Any]:
    raw = groq_chat(system_prompt, user_prompt, temperature, max_tokens)
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return {}
    try:
        return json.loads(raw[start:end])
    except json.JSONDecodeError:
        log.warning("[groq] JSON inválido: %s", raw[:200])
        return {}
