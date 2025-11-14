from __future__ import annotations

import time
from fastapi import HTTPException

from app.infra.redis_client import get_redis


def token_bucket(key: str, rate_per_min: int, capacity: int) -> bool:
    r = get_redis()
    now = time.time()
    p = r.pipeline()
    p.get(f"{key}:tokens")
    p.get(f"{key}:ts")
    tokens, ts = p.execute()
    tokens = float(tokens) if tokens is not None else float(capacity)
    ts = float(ts) if ts is not None else now
    delta = now - ts
    tokens = min(capacity, tokens + delta * (rate_per_min / 60.0))
    allowed = tokens >= 1.0
    tokens = tokens - 1.0 if allowed else tokens
    r.mset({f"{key}:tokens": tokens, f"{key}:ts": now})
    return allowed


def enforce_rate(user_id: str, route: str, rpm: int = 120, cap: int = 200):
    key = f"rl:{user_id}:{route}"
    if not token_bucket(key, rpm, cap):
        raise HTTPException(status_code=429, detail="rate_limited")


def add_quota(org_id: str, metric: str, delta: int = 1, limit: int = 5000):
    r = get_redis()
    key = f"q:{org_id}:{metric}:{time.strftime('%Y-%m-%d')}"
    newv = r.incrby(key, delta)
    r.expire(key, 60 * 60 * 36)
    if newv > limit:
        raise HTTPException(402, detail=f"quota_exceeded:{metric}")


def get_quota(org_id: str, metric: str) -> int:
    r = get_redis()
    key = f"q:{org_id}:{metric}:{time.strftime('%Y-%m-%d')}"
    v = r.get(key)
    return int(v or 0)
