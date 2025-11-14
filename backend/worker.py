#!/usr/bin/env python3
from __future__ import annotations

import os
from rq import Worker, Queue
from redis import Redis

listen = ["runs"]
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def _queues(conn: Redis) -> list[Queue]:
    return [Queue(name, connection=conn) for name in listen]


if __name__ == "__main__":
    conn = Redis.from_url(redis_url)
    worker = Worker(_queues(conn), connection=conn)
    worker.work(with_scheduler=True)
