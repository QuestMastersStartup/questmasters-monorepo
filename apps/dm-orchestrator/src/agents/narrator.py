from __future__ import annotations

from threading import Thread
from typing import Any, Generator

from transformers import TextIteratorStreamer

from src.blackboard import Blackboard
from src.model_loader import get_model, get_tokenizer, switch_adapter
from src.schemas import DeltaChunk

def _build_prompt(blackboard: Blackboard) -> str:
    history = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in blackboard["conversation_history"][-6:]
    )
    l2 = "\n".join(ep["content"] for ep in blackboard.get("l2_context", [])[:3])
    arbiter = blackboard.get("arbiter_ruling", "")
    npcs = "\n".join(blackboard.get("npc_responses", []))
    player = blackboard.get("player_input", "")
    return (
        f"Contexto episódico:\n{l2}\n\n"
        f"Resolución árbitro:\n{arbiter}\n\n"
        f"Respuestas NPC:\n{npcs}\n\n"
        f"Historial reciente:\n{history}\n\n"
        f"Jugador: {player}\nDM:"
    )


def stream_narrator(blackboard: Blackboard) -> Generator[DeltaChunk, None, str]:
    switch_adapter("narrator")
    model = get_model()
    tokenizer = get_tokenizer()
    prompt = _build_prompt(blackboard)

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    generate_kwargs = {**inputs, "max_new_tokens": 512, "temperature": 0.8, "do_sample": True, "streamer": streamer}

    thread = Thread(target=model.generate, kwargs=generate_kwargs, daemon=True)
    thread.start()

    full_response = ""
    for token in streamer:
        full_response += token
        yield DeltaChunk(content=token)

    thread.join()
    return full_response


def run_narrator(blackboard: Blackboard) -> dict[str, Any]:
    """Versión síncrona para uso en nodos LangGraph (sin streaming)."""
    switch_adapter("narrator")
    model = get_model()
    tokenizer = get_tokenizer()
    prompt = _build_prompt(blackboard)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    output_ids = model.generate(**inputs, max_new_tokens=512, temperature=0.8, do_sample=True)
    prompt_len = inputs["input_ids"].shape[1]
    response = tokenizer.decode(output_ids[0][prompt_len:], skip_special_tokens=True)
    return {"narrator_draft": response.strip()}
