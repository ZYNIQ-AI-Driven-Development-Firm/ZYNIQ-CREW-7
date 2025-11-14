"""Smoke tests for auth and run flows using an in-memory stack."""
from __future__ import annotations

import atexit
import os
import tempfile
from typing import Callable

import fakeredis
import pytest
from fastapi.testclient import TestClient

# configure test environment before importing the app
if "APP_SECRET" not in os.environ:
    os.environ["APP_SECRET"] = "test-secret"
_db_fd, _DB_PATH = tempfile.mkstemp(prefix="crew7_test_", suffix=".db")
os.close(_db_fd)
os.environ["DB_URL"] = f"sqlite+pysqlite:///{_DB_PATH}"
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from app.main import app  # noqa: E402  pylint: disable=wrong-import-position
from app.infra import redis_client  # noqa: E402
from app.infra.db import Base, SessionLocal, engine  # noqa: E402
from app.models.billing import ensure_wallet  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.bootstrap import ensure_seed_crews  # noqa: E402
from app.services import crew_service, jobs  # noqa: E402

def _cleanup_db_path() -> None:
    engine.dispose()
    if os.path.exists(_DB_PATH):
        os.remove(_DB_PATH)


atexit.register(_cleanup_db_path)


@pytest.fixture(autouse=True)
def _reset_database() -> None:
    """Provide a clean database and seeded crews for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        ensure_seed_crews(session)


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    fake_redis = fakeredis.FakeRedis(decode_responses=True)
    redis_client._redis = fake_redis  # type: ignore[attr-defined]
    monkeypatch.setattr(redis_client, "get_redis", lambda: fake_redis)

    class DummyQueue:
        def __init__(self) -> None:
            self.enqueued: list[tuple[Callable[..., object], tuple, dict]] = []

        def enqueue(self, func: Callable[..., object], *args, **kwargs) -> None:
            self.enqueued.append((func, args, kwargs))

    dummy_queue = DummyQueue()
    monkeypatch.setattr(jobs, "get_queue", lambda: dummy_queue)
    monkeypatch.setattr(crew_service, "get_queue", lambda: dummy_queue)

    return TestClient(app)


def test_auth_and_run_flow(client: TestClient) -> None:
    register = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "Password123!"},
    )
    assert register.status_code == 200

    login = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "Password123!"},
    )
    assert login.status_code == 200
    token = login.json()["access"]
    headers = {"Authorization": f"Bearer {token}"}

    marketplace = client.get("/marketplace", headers=headers)
    assert marketplace.status_code == 200
    crew_id = marketplace.json()[0]["id"]

    forked = client.post(f"/marketplace/{crew_id}/fork", headers=headers)
    assert forked.status_code == 200
    user_crew = forked.json()["id"]

    with SessionLocal() as session:
        user_row = session.query(User).filter(User.email == "test@example.com").one()
        wallet = ensure_wallet(session, user_row.org_id)
        wallet.credits = 100
        session.commit()

    api_key_resp = client.post(f"/crews/{user_crew}/apikey", headers=headers)
    assert api_key_resp.status_code == 200
    api_key = api_key_resp.json()["api_key"]

    run_resp = client.post(
        f"/runs/crew/{user_crew}",
        headers=headers,
        json={"prompt": "Smoke test"},
    )
    assert run_resp.status_code == 200
    run_id = run_resp.json()["id"]

    status = client.get(
        f"/runs/{run_id}",
        headers={"X-Crew-Key": api_key},
    )
    assert status.status_code == 200
    assert status.json()["status"] == "queued"


def test_metrics_recording_uses_redis(client: TestClient) -> None:
    from app.services.metrics import record_run_done, record_run_started

    record_run_started("crew-alpha")
    record_run_done("crew-alpha", "succeeded")

    redis = redis_client.get_redis()
    assert redis.hgetall("metrics:runs_started") == {"crew-alpha": "1"}
    assert redis.hgetall("metrics:runs_done") == {"crew-alpha:succeeded": "1"}
