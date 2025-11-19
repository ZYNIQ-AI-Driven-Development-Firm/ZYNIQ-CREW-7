"""
Shared pytest fixtures for API tests.

This module provides common fixtures used across all API test files.
"""
from __future__ import annotations

import atexit
import os
import tempfile
from typing import Callable

import fakeredis
import pytest
from fastapi.testclient import TestClient

# Configure test environment before importing the app
if "APP_SECRET" not in os.environ:
    os.environ["APP_SECRET"] = "test-secret-key-for-testing"
_db_fd, _DB_PATH = tempfile.mkstemp(prefix="crew7_api_test_", suffix=".db")
os.close(_db_fd)
os.environ["DB_URL"] = f"sqlite+pysqlite:///{_DB_PATH}"
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from app.main import app  # noqa: E402
from app.infra import redis_client  # noqa: E402
from app.infra.db import Base, SessionLocal, engine  # noqa: E402
from app.models.billing import ensure_wallet  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.bootstrap import ensure_seed_crews  # noqa: E402
from app.services import crew_service, jobs  # noqa: E402


def _cleanup_db_path() -> None:
    """Clean up test database file on exit."""
    engine.dispose()
    if os.path.exists(_DB_PATH):
        os.remove(_DB_PATH)


atexit.register(_cleanup_db_path)


@pytest.fixture(autouse=True)
def _reset_database() -> None:
    """Provide a clean database for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        ensure_seed_crews(session)


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """Create test client with mocked dependencies."""
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


@pytest.fixture()
def auth_token(client: TestClient) -> str:
    """Register and login user, return auth token."""
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "Password123!"}
    )
    
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "Password123!"}
    )
    return response.json()["access"]


@pytest.fixture()
def auth_headers(auth_token: str) -> dict[str, str]:
    """Return authorization headers."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture()
def marketplace_crew_id(client: TestClient, auth_headers: dict[str, str]) -> str:
    """Get a marketplace crew ID."""
    marketplace = client.get("/marketplace", headers=auth_headers)
    return marketplace.json()[0]["id"]


@pytest.fixture()
def user_crew_id(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str) -> str:
    """Create a user crew by forking a marketplace crew."""
    forked = client.post(f"/marketplace/{marketplace_crew_id}/fork", headers=auth_headers)
    return forked.json()["id"]


@pytest.fixture()
def user_with_credits(client: TestClient, auth_token: str) -> None:
    """Add credits to the test user's wallet."""
    with SessionLocal() as session:
        user_row = session.query(User).filter(User.email == "test@example.com").one()
        wallet = ensure_wallet(session, user_row.org_id)
        wallet.credits = 1000
        session.commit()
