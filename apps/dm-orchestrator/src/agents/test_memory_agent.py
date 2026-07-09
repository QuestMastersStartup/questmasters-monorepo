from unittest.mock import MagicMock

import networkx as nx
import pytest

from src.agents import memory_agent


def _make_blackboard(needs_memory: bool, player_input: str = "¿Recuerdas al posadero?") -> dict:
    return {
        "session_id": "session-1",
        "campaign_prompt": "Una mazmorra olvidada",
        "conversation_history": [{"role": "player", "content": player_input}],
        "player_input": player_input,
        "route_decision": {
            "needs_memory": needs_memory,
            "needs_arbiter": False,
            "needs_npc": False,
            "needs_world": False,
        },
        "l1_context": "",
        "arbiter_ruling": "",
        "npc_responses": [],
        "world_state": "",
        "narrator_draft": "",
        "extracted_events": [],
        "extracted_entities": [],
        "usage": {},
    }


def test_caso_limite_sin_necesidad_de_memoria_no_consulta_ninguna_capa(monkeypatch):
    l2_mock = MagicMock()
    monkeypatch.setattr(memory_agent.l2_episodic, "retrieve_relevant_episodes", l2_mock)

    blackboard = _make_blackboard(needs_memory=False)

    result = memory_agent.run_memory_agent(blackboard)

    assert result == {"l2_context": [], "l3_context": [], "l4_context": []}
    l2_mock.assert_not_called()


def test_caso_valido_con_necesidad_de_memoria_combina_l2_l3_l4(monkeypatch):
    monkeypatch.setattr(
        memory_agent.l2_episodic,
        "retrieve_relevant_episodes",
        lambda session_id, query, n_results=5: [
            {"id": "ep-1", "content": "El posadero mencionó un mapa"}
        ],
    )

    graph = nx.DiGraph()
    graph.add_node("posadero", type="npc", name="Posadero")
    monkeypatch.setattr(memory_agent.l3_semantic, "load_graph", lambda session_id: graph)

    monkeypatch.setattr(
        memory_agent.l4_procedural,
        "query_rules",
        lambda query, n_results=5: [
            {"id": "rule-1", "content": "Persuasión CD 15", "metadata": {}}
        ],
    )

    blackboard = _make_blackboard(needs_memory=True, player_input="¿Recuerdas al posadero?")

    result = memory_agent.run_memory_agent(blackboard)

    assert result == {
        "l2_context": [{"id": "ep-1", "content": "El posadero mencionó un mapa"}],
        "l3_context": [{"type": "npc", "name": "Posadero", "id": "posadero"}],
        "l4_context": [{"id": "rule-1", "content": "Persuasión CD 15", "metadata": {}}],
    }


def test_caso_invalido_fallo_en_una_capa_de_memoria_se_propaga(monkeypatch):
    def _boom(session_id, query, n_results=5):
        raise RuntimeError("chroma no disponible")

    monkeypatch.setattr(memory_agent.l2_episodic, "retrieve_relevant_episodes", _boom)

    blackboard = _make_blackboard(needs_memory=True)

    with pytest.raises(RuntimeError, match="chroma no disponible"):
        memory_agent.run_memory_agent(blackboard)
