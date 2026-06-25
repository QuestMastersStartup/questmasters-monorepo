from __future__ import annotations

import logging
import time
from threading import Thread
from typing import Generator

from src.agents.arbiter import run_arbiter
from src.agents.narrator import stream_narrator
from src.agents.npc import run_npc
from src.agents.router import run_router
from src.agents.world import run_world
from src.blackboard import Blackboard
from src.extraction import run_extraction
from src.memory import l1_working
from src.model_loader import get_input_device, get_model, get_tokenizer
from src.schemas import (
    DmModelRequest,
    DoneChunk,
    MemorySnapshot,
    MetadataChunk,
    SseChunk,
    ThinkingChunk,
    UsageStats,
)

log = logging.getLogger(__name__)


async def _llm_func(prompt: str, **_kwargs: object) -> str:
    model = get_model()
    tokenizer = get_tokenizer()
    device = get_input_device()
    messages = [{"role": "user", "content": prompt}]
    input_ids = tokenizer.apply_chat_template(
        messages, return_tensors="pt",
        add_generation_prompt=True, return_dict=False,
    ).to(device)
    output_ids = model.generate(
        input_ids=input_ids, max_new_tokens=256, do_sample=False,
    )
    return tokenizer.decode(
        output_ids[0][input_ids.shape[1]:], skip_special_tokens=True,
    )


def _build_initial_state(request: DmModelRequest) -> Blackboard:
    return Blackboard(
        session_id=request.session_id,
        campaign_prompt=request.campaign_prompt,
        conversation_history=request.conversation_history,
        player_input=request.player_input or "",
        route_decision={},
        l1_context="",
        arbiter_ruling="",
        npc_responses=[],
        world_state="",
        narrator_draft="",
        extracted_events=[],
        extracted_entities=[],
        usage={},
    )


def _route_summary(decision: dict) -> str:
    active = []
    if decision.get("needs_memory"):
        active.append("memoria")
    if decision.get("needs_arbiter"):
        active.append("reglas")
    if decision.get("needs_npc"):
        active.append("npcs")
    if decision.get("needs_world"):
        active.append("mundo")
    if not active:
        return "Solo narración directa"
    return f"Consultando: {', '.join(active)}"


def run(request: DmModelRequest) -> Generator[SseChunk, None, None]:
    t_start = time.monotonic()
    state = _build_initial_state(request)

    # ── 1. Router (pre-computado por Workers AI → Groq → keywords) ──
    pre_computed = None
    if request.route_decision:
        pre_computed = request.route_decision.model_dump()
    updates = run_router(state, pre_computed=pre_computed)
    state.update(updates)
    route = state["route_decision"]

    yield ThinkingChunk(
        agent="router",
        summary=_route_summary(route),
    )

    # ── 2. L1 Working Memory (una query compartida) ──
    if route.get("needs_memory"):
        yield ThinkingChunk(
            agent="memoria",
            summary="Consultando memoria de trabajo (L1)...",
        )
        l1_context = l1_working.retrieve(
            state["session_id"],
            state["player_input"],
            _llm_func,
        )
        state["l1_context"] = l1_context

        if l1_context:
            preview = l1_context[:120].replace("\n", " ")
            yield ThinkingChunk(
                agent="memoria",
                summary=f"L1: {preview}...",
            )
        else:
            yield ThinkingChunk(
                agent="memoria",
                summary="L1 vacío (primeros turnos), agentes usarán L2/L3/L4",
            )

    # ── 3. Árbitro de Reglas (bb:L1, consulta L4 directo) ──
    if route.get("needs_arbiter"):
        yield ThinkingChunk(
            agent="reglas",
            summary="Evaluando reglas y coherencia (L1+L4)...",
        )
        updates = run_arbiter(state)
        state.update(updates)

        ruling_preview = state["arbiter_ruling"][:120]
        yield ThinkingChunk(agent="reglas", summary=ruling_preview)

    # ── 4. NPCs (bb:L1, consulta L2+L3 directo) ──
    if route.get("needs_npc"):
        yield ThinkingChunk(
            agent="npcs",
            summary="Determinando reacciones de PNJs (L1+L2+L3)...",
        )
        updates = run_npc(state)
        state.update(updates)

        npc_preview = (
            state["npc_responses"][0][:120]
            if state["npc_responses"]
            else "Sin PNJs activos"
        )
        yield ThinkingChunk(agent="npcs", summary=npc_preview)

    # ── 5. Mundo (bb:L1, consulta L2+L3 directo) ──
    if route.get("needs_world"):
        yield ThinkingChunk(
            agent="mundo",
            summary="Evaluando cambios en el mundo (L1+L2+L3)...",
        )
        updates = run_world(state)
        state.update(updates)

        world_preview = (
            state["world_state"][:120]
            if state["world_state"]
            else "Sin cambios"
        )
        yield ThinkingChunk(agent="mundo", summary=world_preview)

    # ── 6. Narrador (streaming, bb:L1, consulta L2 directo) ──
    yield ThinkingChunk(agent="narrador", summary="Narrando (L1+L2)...")

    full_response = ""
    for chunk in stream_narrator(state):
        full_response += chunk.content
        yield chunk

    state["narrator_draft"] = full_response

    # ── 7. Post-turno: extracción → L2+L3, inserción → L1 ──
    turn = len(request.conversation_history)
    model = get_model()
    tokenizer = get_tokenizer()
    extracted = run_extraction(
        model, tokenizer,
        request.session_id, turn,
        full_response, request.player_input or "",
    )

    def _insert_l1() -> None:
        l1_working.insert_turn(
            session_id=request.session_id,
            turn=turn,
            player_input=request.player_input or "",
            dm_response=full_response,
            llm_func=_llm_func,
            arbiter_ruling=state["arbiter_ruling"],
            npc_responses="\n".join(state["npc_responses"]),
            world_state=state["world_state"],
        )

    Thread(target=_insert_l1, daemon=True).start()

    latency_ms = int((time.monotonic() - t_start) * 1000)
    episode_ids = [e.get("id", "") for e in extracted.get("events", [])]
    entity_ids = [e.get("id", "") for e in extracted.get("entities", [])]

    yield MetadataChunk(
        memory_snapshot=MemorySnapshot(
            l2_episode_ids=episode_ids,
            l3_entity_ids=entity_ids,
        ),
        usage=UsageStats(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        latency_ms=latency_ms,
    )
    yield DoneChunk()
