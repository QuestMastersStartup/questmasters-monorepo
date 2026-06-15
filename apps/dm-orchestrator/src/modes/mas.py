from __future__ import annotations

import time
from typing import Generator

from langgraph.graph import END, StateGraph

from src.agents.arbiter import run_arbiter
from src.agents.memory_agent import run_memory_agent
from src.agents.narrator import stream_narrator
from src.agents.npc import run_npc
from src.blackboard import Blackboard
from src.extraction import run_extraction
from src.model_loader import get_model, get_tokenizer
from src.schemas import (
    DmModelRequest,
    DoneChunk,
    MemorySnapshot,
    MetadataChunk,
    SseChunk,
    UsageStats,
)


def _build_initial_state(request: DmModelRequest) -> Blackboard:
    return Blackboard(
        session_id=request.session_id,
        campaign_prompt=request.campaign_prompt,
        conversation_history=request.conversation_history,
        player_input=request.player_input or "",
        l2_context=[],
        l3_context=[],
        l4_context=[],
        arbiter_ruling="",
        npc_responses=[],
        narrator_draft="",
        extracted_events=[],
        extracted_entities=[],
        usage={},
    )


def _build_prep_graph():
    """Construye el grafo LangGraph para los agentes previos al narrador."""
    graph: StateGraph = StateGraph(Blackboard)
    graph.add_node("memory", run_memory_agent)
    graph.add_node("arbiter", run_arbiter)
    graph.add_node("npc", run_npc)
    graph.set_entry_point("memory")
    graph.add_edge("memory", "arbiter")
    graph.add_edge("arbiter", "npc")
    graph.add_edge("npc", END)
    return graph.compile()


_prep_graph = _build_prep_graph()


def run(request: DmModelRequest) -> Generator[SseChunk, None, None]:
    t_start = time.monotonic()
    state = _build_initial_state(request)

    # Fase 1: memoria → árbitro → NPC (síncrono, sin streaming)
    state = _prep_graph.invoke(state)

    # Fase 2: Narrador con streaming de tokens
    full_response = ""
    for chunk in stream_narrator(state):
        full_response += chunk.content
        yield chunk

    state["narrator_draft"] = full_response

    # Fase 3: extracción post-turno
    turn = len(request.conversation_history)
    model = get_model()
    tokenizer = get_tokenizer()
    extracted = run_extraction(
        model, tokenizer,
        request.session_id, turn,
        full_response, request.player_input or "",
    )

    latency_ms = int((time.monotonic() - t_start) * 1000)
    episode_ids = [e.get("id", "") for e in extracted.get("events", [])]
    entity_ids = [e.get("id", "") for e in extracted.get("entities", [])]

    yield MetadataChunk(
        memory_snapshot=MemorySnapshot(l2_episode_ids=episode_ids, l3_entity_ids=entity_ids),
        usage=UsageStats(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        latency_ms=latency_ms,
    )
    yield DoneChunk()
