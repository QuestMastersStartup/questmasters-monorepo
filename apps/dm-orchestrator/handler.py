from __future__ import annotations

import runpod

from src.model_loader import get_model  # precarga en arranque del pod
from src.schemas import DmModelRequest, ErrorChunk


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


# Precarga el modelo al arrancar el pod (antes de recibir el primer job)
get_model()

runpod.serverless.start({"handler": handler, "return_aggregate_stream": True})
