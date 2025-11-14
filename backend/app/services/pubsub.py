from __future__ import annotations

import asyncio
import json
import time
from typing import AsyncIterator
from uuid import UUID

from app.infra.redis_client import get_redis

STREAM_PREFIX = "run:"
GROUP = "crew7-consumers"


class RunBus:
    def __init__(self) -> None:
        self._redis = get_redis()

    def _stream(self, run_id: UUID) -> str:
        return f"{STREAM_PREFIX}{run_id}"

    async def publish(self, run_id: UUID, event: dict) -> None:
        self._redis.xadd(self._stream(run_id), {"e": json.dumps(event)}, maxlen=1000)

    async def consume(self, run_id: UUID) -> AsyncIterator[dict]:
        stream = self._stream(run_id)
        consumer = f"c-{int(time.time() * 1000) % 1_000_000}"
        try:
            self._redis.xgroup_create(stream, GROUP, id="$", mkstream=True)
        except Exception:
            pass
        last_id = ">"
        while True:
            records = self._redis.xreadgroup(GROUP, consumer, {stream: last_id}, count=10, block=5000)
            if not records:
                await asyncio.sleep(0.05)
                continue
            for _, entries in records:
                for entry_id, fields in entries:
                    payload = json.loads(fields.get("e", "{}"))
                    yield payload
                    self._redis.xack(stream, GROUP, entry_id)


bus = RunBus()
