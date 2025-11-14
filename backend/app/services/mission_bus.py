from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any

from app.infra.redis_client import get_redis

CHANNEL_PREFIX = "mission:"


@dataclass
class MissionSubscription:
    queue: asyncio.Queue[dict[str, Any]]
    task: asyncio.Task[None]

    async def close(self) -> None:
        self.task.cancel()
        try:
            await self.task
        except asyncio.CancelledError:
            pass


class MissionBus:
    """Redis-backed fan-out for mission-level websocket events."""

    def __init__(self) -> None:
        self._redis = get_redis()

    def _channel(self, org_id: str) -> str:
        return f"{CHANNEL_PREFIX}{org_id}"

    async def subscribe(self, org_id: str) -> MissionSubscription:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=100)
        pubsub = self._redis.pubsub()
        await asyncio.to_thread(pubsub.subscribe, self._channel(org_id))

        async def reader() -> None:
            try:
                while True:
                    message = await asyncio.to_thread(
                        pubsub.get_message,
                        ignore_subscribe_messages=True,
                        timeout=2.0,
                    )
                    if not message:
                        await asyncio.sleep(0.1)
                        continue
                    data = message.get("data")
                    if isinstance(data, bytes):
                        data = data.decode()
                    if not isinstance(data, str):
                        continue
                    try:
                        payload = json.loads(data)
                    except json.JSONDecodeError:
                        continue
                    try:
                        queue.put_nowait(payload)
                    except asyncio.QueueFull:
                        try:
                            queue.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                        queue.put_nowait(payload)
            except asyncio.CancelledError:  # noqa: PERF203 - propagate cancellation
                raise
            finally:
                await asyncio.to_thread(pubsub.close)

        task = asyncio.create_task(reader())
        return MissionSubscription(queue=queue, task=task)

    async def unsubscribe(self, subscription: MissionSubscription) -> None:
        await subscription.close()

    async def publish(self, org_id: str, message: dict[str, Any]) -> None:
        payload = json.dumps(message)
        await asyncio.to_thread(self._redis.publish, self._channel(org_id), payload)


mission_bus = MissionBus()


async def publish_signal(org_id: str, status: str, crew_id: str | None = None, **extra: Any) -> None:
    payload: dict[str, Any] = {"status": status}
    if crew_id:
        payload["crewId"] = crew_id
    if extra:
        payload.update(extra)
    await mission_bus.publish(org_id, {"type": "signal", "payload": payload})


async def publish_alert(
    org_id: str,
    severity: str,
    title: str,
    message: str | None = None,
    **extra: Any,
) -> None:
    payload: dict[str, Any] = {"severity": severity, "title": title}
    if message:
        payload["message"] = message
    if extra:
        payload.update(extra)
    await mission_bus.publish(org_id, {"type": "alert", "payload": payload})


async def publish_crew_change(org_id: str, crew_id: str, **extra: Any) -> None:
    payload: dict[str, Any] = {"crewId": crew_id}
    if extra:
        payload.update(extra)
    await mission_bus.publish(org_id, {"type": "crew-change", "payload": payload})
