from __future__ import annotations

from typing import Any

from src.blackboard import Blackboard
from src.memory import l2_episodic, l3_semantic, l4_procedural


def _retrieve_l2(blackboard: Blackboard) -> list[dict]:
    query = blackboard.get("player_input", "")
    return l2_episodic.retrieve_relevant_episodes(blackboard["session_id"], query, n_results=5)


def _retrieve_l3(blackboard: Blackboard) -> list[dict]:
    graph = l3_semantic.load_graph(blackboard["session_id"])
    last_message = (blackboard["conversation_history"] or [{}])[-1].get("content", "")
    relevant_ids = [n for n in graph.nodes() if n.lower() in last_message.lower()][:3]
    context: list[dict] = []
    for entity_id in relevant_ids:
        context.extend(l3_semantic.query_neighbors(graph, entity_id, depth=1))
    return context


def _retrieve_l4(blackboard: Blackboard) -> list[dict]:
    query = blackboard.get("player_input", "")
    return l4_procedural.query_rules(query, n_results=5)


def run_memory_agent(blackboard: Blackboard) -> dict[str, Any]:
    return {
        "l2_context": _retrieve_l2(blackboard),
        "l3_context": _retrieve_l3(blackboard),
        "l4_context": _retrieve_l4(blackboard),
    }
