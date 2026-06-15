from __future__ import annotations

import chromadb

_CHROMA_PATH = "/runpod-volume/shared/l4_srd_chroma"
_COLLECTION_NAME = "srd_rules"


def _srd_collection() -> chromadb.Collection:
    client = chromadb.PersistentClient(path=_CHROMA_PATH)
    return client.get_or_create_collection(_COLLECTION_NAME)


def query_rules(query: str, n_results: int = 5) -> list[dict]:
    collection = _srd_collection()
    results = collection.query(query_texts=[query], n_results=n_results)
    return [
        {
            "id": results["ids"][0][i],
            "content": doc,
            "metadata": results["metadatas"][0][i],
        }
        for i, doc in enumerate(results["documents"][0])
    ]
