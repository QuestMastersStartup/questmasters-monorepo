from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class CharacterSnapshot(BaseModel):
    id: str
    name: str
    class_name: str
    level: int
    hit_points: int
    max_hit_points: int
    conditions: list[str] = []
    inventory: list[str] = []
    notes: str = ""


class DmModelRequest(BaseModel):
    session_id: str
    architecture_type: Literal["monolithic", "mas"]
    model_id: str
    campaign_prompt: str
    characters: list[CharacterSnapshot]
    conversation_history: list[dict]
    player_input: str | None = None
    current_memory_snapshot: dict


class DeltaChunk(BaseModel):
    type: Literal["delta"] = "delta"
    content: str


class MemorySnapshot(BaseModel):
    l2_episode_ids: list[str] = []
    l3_entity_ids: list[str] = []


class UsageStats(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class MetadataChunk(BaseModel):
    type: Literal["metadata"] = "metadata"
    memory_snapshot: MemorySnapshot
    usage: UsageStats
    latency_ms: int


class DoneChunk(BaseModel):
    type: Literal["done"] = "done"


class ErrorChunk(BaseModel):
    type: Literal["error"] = "error"
    message: str


SseChunk = DeltaChunk | MetadataChunk | DoneChunk | ErrorChunk
