from __future__ import annotations

import logging
import os
import sys

import runpod

from src.schemas import DmModelRequest, ErrorChunk

_DEBUG = os.environ.get("DM_DEBUG", "").lower() in ("1", "true")
logging.basicConfig(
    level=logging.DEBUG if _DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger(__name__)


def _run_mode(request: DmModelRequest):
    if request.architecture_type == "mas":
        from src.modes import mas
        return mas.run(request)
    from src.modes import monolithic
    return monolithic.run(request)


def handler(event: dict):
    """Entry point de RunPod Serverless. Genera chunks SSE como stream."""
    log.info("Job recibido | session_id=%s architecture=%s",
             event.get("input", {}).get("session_id", "?"),
             event.get("input", {}).get("architecture_type", "?"))

    if _DEBUG:
        log.debug("Event completo: %s", event)

    try:
        request = DmModelRequest(**event["input"])
    except Exception as exc:
        log.error("Input inválido: %s", exc, exc_info=True)
        yield ErrorChunk(message=f"Input inválido: {exc}").model_dump_json()
        return

    log.info("Iniciando generación para session_id=%s", request.session_id)
    try:
        chunk_count = 0
        for chunk in _run_mode(request):
            chunk_count += 1
            if _DEBUG:
                log.debug("Chunk #%d: %s", chunk_count, chunk.model_dump_json())
            yield chunk.model_dump_json()
        log.info("Generación completada | chunks=%d", chunk_count)
    except Exception as exc:
        log.error("Error durante generación: %s", exc, exc_info=True)
        yield ErrorChunk(message=str(exc)).model_dump_json()


log.info("Python %s | DM_DEBUG=%s", sys.version.split()[0], _DEBUG)
log.info("Iniciando RunPod serverless worker ...")
try:
    runpod.serverless.start({"handler": handler, "return_aggregate_stream": True})
except Exception as exc:
    log.critical("runpod.serverless.start() falló: %s", exc, exc_info=True)
    sys.exit(1)
