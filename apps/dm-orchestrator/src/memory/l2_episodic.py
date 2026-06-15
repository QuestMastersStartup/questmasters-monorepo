from __future__ import annotations

import json
import sqlite3
import uuid
from pathlib import Path
from typing import Any

import chromadb


def _session_path(session_id: str) -> Path:
    path = Path("/runpod-volume/sessions") / session_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def _init_db(session_id: str) -> sqlite3.Connection:
    db_path = _session_path(session_id) / "l2.db"
    conn = sqlite3.connect(str(db_path))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS episodes (
            id      TEXT PRIMARY KEY,
            turn    INTEGER NOT NULL,
            role    TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn


def _chroma_collection(session_id: str) -> chromadb.Collection:
    chroma_path = str(_session_path(session_id) / "l2_chroma")
    client = chromadb.PersistentClient(path=chroma_path)
    return client.get_or_create_collection("episodes")


def save_episode(
    session_id: str,
    turn: int,
    role: str,
    content: str,
    metadata: dict[str, Any],
) -> str:
    episode_id = str(uuid.uuid4())
    conn = _init_db(session_id)
    conn.execute(
        "INSERT INTO episodes (id, turn, role, content, metadata) VALUES (?, ?, ?, ?, ?)",
        (episode_id, turn, role, content, json.dumps(metadata)),
    )
    conn.commit()
    conn.close()

    _chroma_collection(session_id).add(
        ids=[episode_id],
        documents=[content],
        metadatas=[{"turn": turn, "role": role}],
    )
    return episode_id


def retrieve_relevant_episodes(
    session_id: str,
    query: str,
    n_results: int = 5,
) -> list[dict]:
    collection = _chroma_collection(session_id)
    results = collection.query(query_texts=[query], n_results=n_results)
    return [
        {
            "id": results["ids"][0][i],
            "content": doc,
            "metadata": results["metadatas"][0][i],
        }
        for i, doc in enumerate(results["documents"][0])
    ]
