from __future__ import annotations

import json
from typing import Iterable

from qdrant_client.http.models import PointStruct

from app.infra.qdrant_client import ensure_collection, get_qdrant
from app.infra.redis_client import get_redis


def kv_set(namespace: str, key: str, value: dict | str) -> None:
    redis = get_redis()
    payload = json.dumps(value) if isinstance(value, dict) else value
    redis.hset(namespace, key, payload)


def kv_get(namespace: str, key: str) -> str | None:
    redis = get_redis()
    return redis.hget(namespace, key)


def kv_list(namespace: str) -> dict[str, str]:
    redis = get_redis()
    return redis.hgetall(namespace)


def vec_upsert(collection: str, items: Iterable[tuple[str, list[float], dict]]) -> None:
    ensure_collection(collection)
    client = get_qdrant()
    points = [PointStruct(id=item_id, vector=vector, payload=payload) for item_id, vector, payload in items]
    client.upsert(collection_name=collection, points=points)


def vec_search(collection: str, vector: list[float], top_k: int = 5):
    client = get_qdrant()
    return client.search(collection, query_vector=vector, limit=top_k)
