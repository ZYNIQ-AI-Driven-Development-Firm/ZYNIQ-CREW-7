from __future__ import annotations

from redis import Redis

from app.config import settings

_redis: Redis | None = None


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        url = settings.REDIS_URL
        _redis = Redis.from_url(url, decode_responses=True)
    return _redis
