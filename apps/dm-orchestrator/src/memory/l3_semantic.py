from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import networkx as nx


def _graph_path(session_id: str) -> Path:
    session_path = Path("/runpod-volume/sessions") / session_id
    session_path.mkdir(parents=True, exist_ok=True)
    return session_path / "l3_graph.json"


def load_graph(session_id: str) -> nx.DiGraph:
    path = _graph_path(session_id)
    if not path.exists():
        return nx.DiGraph()
    return nx.node_link_graph(json.loads(path.read_text()))


def save_graph(session_id: str, graph: nx.DiGraph) -> None:
    _graph_path(session_id).write_text(json.dumps(nx.node_link_data(graph)))


def upsert_entity(
    graph: nx.DiGraph,
    entity_id: str,
    entity_type: str,
    attributes: dict[str, Any],
) -> None:
    graph.add_node(entity_id, type=entity_type, **attributes)


def upsert_relation(
    graph: nx.DiGraph,
    source: str,
    target: str,
    relation: str,
) -> None:
    graph.add_edge(source, target, relation=relation)


def query_neighbors(
    graph: nx.DiGraph,
    entity_id: str,
    depth: int = 1,
) -> list[dict]:
    if entity_id not in graph:
        return []
    nodes = nx.single_source_shortest_path_length(graph, entity_id, cutoff=depth)
    results = []
    for node_id in nodes:
        data = dict(graph.nodes[node_id])
        data["id"] = node_id
        results.append(data)
    return results


def update_from_extraction(session_id: str, extracted_entities: list[dict]) -> None:
    graph = load_graph(session_id)
    for item in extracted_entities:
        entity_id = item["id"]
        entity_type = item.get("type", "unknown")
        attrs = {k: v for k, v in item.items() if k not in ("id", "type", "relations")}
        upsert_entity(graph, entity_id, entity_type, attrs)
        for rel in item.get("relations", []):
            upsert_relation(graph, entity_id, rel["target"], rel["type"])
    save_graph(session_id, graph)
