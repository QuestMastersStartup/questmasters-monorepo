from __future__ import annotations

import logging
import sys

import runpod

from src.schemas import DmModelRequest, ErrorChunk

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger(__name__)


def _run_mode(request: DmModelRequest):
    if request.architecture_type == "mas":
        from src.modes import mas
        return mas.run(request)
    from src.modes import monolithic
    return monolithic.run(request)


def handler(event: dict):
    """Entry point de RunPod Serverless. Genera chunks SSE como stream."""
    try:
        request = DmModelRequest(**event["input"])
    except Exception as exc:
        yield ErrorChunk(message=f"Input inválido: {exc}").model_dump_json()
        return

    try:
        for chunk in _run_mode(request):
            yield chunk.model_dump_json()
    except Exception as exc:
        yield ErrorChunk(message=str(exc)).model_dump_json()


log.info("Starting RunPod serverless worker ...")
try:
    runpod.serverless.start({"handler": handler, "return_aggregate_stream": True})
except Exception as exc:
    log.critical("runpod.serverless.start() failed: %s", exc, exc_info=True)
    sys.exit(1)
