from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any, Iterable
from uuid import uuid4

from qdrant_client.http.models import Filter, FieldCondition, MatchValue, PointStruct

from app.infra.qdrant_client import ensure_collection, get_qdrant
from app.infra.redis_client import get_redis


# ============================================================================
# KEY-VALUE STORE (Redis) - Fast lookups, sessions, cache
# ============================================================================

def kv_set(namespace: str, key: str, value: dict | str) -> None:
    """Store a key-value pair in Redis under a namespace (hash)."""
    redis = get_redis()
    payload = json.dumps(value) if isinstance(value, dict) else value
    redis.hset(namespace, key, payload)


def kv_get(namespace: str, key: str) -> str | None:
    """Retrieve a value from Redis by namespace and key."""
    redis = get_redis()
    result = redis.hget(namespace, key)
    return result.decode() if isinstance(result, bytes) else result


def kv_list(namespace: str) -> dict[str, str]:
    """List all key-value pairs in a namespace."""
    redis = get_redis()
    raw = redis.hgetall(namespace)
    return {
        k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v
        for k, v in raw.items()
    }


def kv_delete(namespace: str, key: str) -> None:
    """Delete a key from a namespace."""
    redis = get_redis()
    redis.hdel(namespace, key)


# ============================================================================
# VECTOR STORE (Qdrant) - Semantic search, long-term memory
# ============================================================================

def vec_upsert(collection: str, items: Iterable[tuple[str, list[float], dict]]) -> None:
    """Insert or update vectors in a Qdrant collection."""
    ensure_collection(collection)
    client = get_qdrant()
    points = [PointStruct(id=item_id, vector=vector, payload=payload) for item_id, vector, payload in items]
    client.upsert(collection_name=collection, points=points)


def vec_search(collection: str, vector: list[float], top_k: int = 5, filters: dict[str, Any] | None = None):
    """Search for similar vectors in a collection with optional filters."""
    client = get_qdrant()
    
    query_filter = None
    if filters:
        conditions = [
            FieldCondition(key=key, match=MatchValue(value=value))
            for key, value in filters.items()
        ]
        query_filter = Filter(must=conditions)
    
    return client.search(
        collection_name=collection,
        query_vector=vector,
        limit=top_k,
        query_filter=query_filter
    )


def vec_delete(collection: str, point_ids: list[str]) -> None:
    """Delete specific vectors from a collection."""
    client = get_qdrant()
    client.delete(collection_name=collection, points_selector=point_ids)


def vec_count(collection: str) -> int:
    """Count total vectors in a collection."""
    client = get_qdrant()
    result = client.count(collection_name=collection)
    return result.count


# ============================================================================
# CREW MEMORY - High-level memory operations for AI crews
# ============================================================================

def add_crew_memory(
    crew_id: str,
    content: str,
    embedding: list[float],
    metadata: dict[str, Any] | None = None,
    mission_id: str | None = None,
    agent_role: str | None = None,
) -> str:
    """
    Add a memory to a crew's long-term vector store.
    
    Args:
        crew_id: Unique crew identifier
        content: Text content to store
        embedding: Vector representation of the content
        metadata: Additional metadata (tags, context, etc.)
        mission_id: Optional mission this memory relates to
        agent_role: Optional agent role that created this memory
    
    Returns:
        memory_id: Unique identifier for this memory
    """
    collection = f"crew_memory_{crew_id}"
    ensure_collection(collection)
    
    memory_id = str(uuid4())
    payload = {
        "content": content,
        "crew_id": crew_id,
        "mission_id": mission_id,
        "agent_role": agent_role,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
    }
    
    vec_upsert(collection, [(memory_id, embedding, payload)])
    
    # Also cache recent memory in Redis for fast access
    kv_set(f"crew_recent_{crew_id}", memory_id, json.dumps(payload))
    
    return memory_id


def search_crew_memory(
    crew_id: str,
    query_embedding: list[float],
    top_k: int = 5,
    mission_id: str | None = None,
    agent_role: str | None = None,
) -> list[dict[str, Any]]:
    """
    Search crew's memory for relevant past experiences.
    
    Args:
        crew_id: Unique crew identifier
        query_embedding: Vector representation of the search query
        top_k: Number of results to return
        mission_id: Optional filter by mission
        agent_role: Optional filter by agent role
    
    Returns:
        List of memory records with content, score, and metadata
    """
    collection = f"crew_memory_{crew_id}"
    
    filters = {}
    if mission_id:
        filters["mission_id"] = mission_id
    if agent_role:
        filters["agent_role"] = agent_role
    
    try:
        results = vec_search(collection, query_embedding, top_k, filters)
        return [
            {
                "id": str(hit.id),
                "content": hit.payload.get("content", ""),
                "score": hit.score,
                "mission_id": hit.payload.get("mission_id"),
                "agent_role": hit.payload.get("agent_role"),
                "timestamp": hit.payload.get("timestamp"),
                "metadata": hit.payload.get("metadata", {}),
            }
            for hit in results
        ]
    except Exception:
        # Collection doesn't exist yet or other error
        return []


def add_mission_memory(
    mission_id: str,
    content: str,
    embedding: list[float],
    metadata: dict[str, Any] | None = None,
    agent_role: str | None = None,
) -> str:
    """
    Add a memory specific to a mission (more focused than crew-level).
    
    Useful for:
    - Tracking decisions made during a mission
    - Storing intermediate results
    - Recording agent communications
    """
    collection = f"mission_memory_{mission_id}"
    ensure_collection(collection)
    
    memory_id = str(uuid4())
    payload = {
        "content": content,
        "mission_id": mission_id,
        "agent_role": agent_role,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
    }
    
    vec_upsert(collection, [(memory_id, embedding, payload)])
    return memory_id


def search_mission_memory(
    mission_id: str,
    query_embedding: list[float],
    top_k: int = 5,
    agent_role: str | None = None,
) -> list[dict[str, Any]]:
    """Search within a specific mission's memory."""
    collection = f"mission_memory_{mission_id}"
    
    filters = {}
    if agent_role:
        filters["agent_role"] = agent_role
    
    try:
        results = vec_search(collection, query_embedding, top_k, filters)
        return [
            {
                "id": str(hit.id),
                "content": hit.payload.get("content", ""),
                "score": hit.score,
                "agent_role": hit.payload.get("agent_role"),
                "timestamp": hit.payload.get("timestamp"),
                "metadata": hit.payload.get("metadata", {}),
            }
            for hit in results
        ]
    except Exception:
        return []


def get_crew_memory_stats(crew_id: str) -> dict[str, Any]:
    """Get statistics about a crew's memory."""
    collection = f"crew_memory_{crew_id}"
    
    try:
        total_memories = vec_count(collection)
        recent = kv_list(f"crew_recent_{crew_id}")
        
        return {
            "crew_id": crew_id,
            "total_memories": total_memories,
            "recent_count": len(recent),
            "collection_name": collection,
        }
    except Exception:
        return {
            "crew_id": crew_id,
            "total_memories": 0,
            "recent_count": 0,
            "collection_name": collection,
        }


def clear_crew_memory(crew_id: str) -> None:
    """Clear all memories for a crew (use with caution!)."""
    collection = f"crew_memory_{crew_id}"
    client = get_qdrant()
    try:
        client.delete_collection(collection)
    except Exception:
        pass  # Collection might not exist
    
    # Clear Redis cache
    redis = get_redis()
    redis.delete(f"crew_recent_{crew_id}")


def clear_mission_memory(mission_id: str) -> None:
    """Clear all memories for a specific mission."""
    collection = f"mission_memory_{mission_id}"
    client = get_qdrant()
    try:
        client.delete_collection(collection)
    except Exception:
        pass
