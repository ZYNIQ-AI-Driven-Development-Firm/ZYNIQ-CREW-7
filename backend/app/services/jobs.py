from __future__ import annotations

import os
from typing import Any

from redis import Redis
from rq import Queue


_redis: Redis | None = None
_q: Queue | None = None


def get_queue() -> Queue:
    global _redis, _q
    if _q is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis = Redis.from_url(url)
        _q = Queue("runs", connection=_redis, default_timeout=60 * 30)
    return _q
