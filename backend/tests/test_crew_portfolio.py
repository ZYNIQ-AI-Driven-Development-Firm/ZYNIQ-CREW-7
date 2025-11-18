"""Tests for crew portfolio, ratings, and XP system."""
from __future__ import annotations

import atexit
import os
import tempfile
from typing import TYPE_CHECKING

import pytest
from fastapi.testclient import TestClient

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

# Configure test environment
if "APP_SECRET" not in os.environ:
    os.environ["APP_SECRET"] = "test-secret"
if "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = "test-dummy-key"
if "ANTHROPIC_API_KEY" not in os.environ:
    os.environ["ANTHROPIC_API_KEY"] = "test-dummy-key"
_db_fd, _DB_PATH = tempfile.mkstemp(prefix="crew7_portfolio_test_", suffix=".db")
os.close(_db_fd)
os.environ["DB_URL"] = f"sqlite+pysqlite:///{_DB_PATH}"

from app.main import app
from app.infra.db import Base, SessionLocal, engine
from app.models.crew import Crew
from app.models.user import User
from app.services.bootstrap import ensure_seed_crews


def _cleanup_db_path() -> None:
    engine.dispose()
    if os.path.exists(_DB_PATH):
        os.remove(_DB_PATH)


atexit.register(_cleanup_db_path)


@pytest.fixture(autouse=True)
def _reset_database() -> None:
    """Provide a clean database for every test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        ensure_seed_crews(session)


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def auth_token(client: TestClient) -> str:
    """Register and login to get auth token."""
    email = f"test_{os.urandom(4).hex()}@example.com"
    password = "testpass123"
    
    client.post("/auth/register", json={"email": email, "password": password})
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["access"]


@pytest.fixture()
def crew_id() -> str:
    """Get a crew ID from seeded crews."""
    with SessionLocal() as session:
        crew = session.query(Crew).first()
        return str(crew.id) if crew else None


def test_get_crew_portfolio(client: TestClient, crew_id: str):
    """Test getting crew portfolio."""
    resp = client.get(f"/crews/{crew_id}/portfolio")
    assert resp.status_code == 200
    
    data = resp.json()
    assert data["crew_id"] == crew_id
    assert "crew_name" in data
    assert data["missions_completed"] >= 0
    assert data["hours_worked"] >= 0
    assert data["rating_count"] >= 0
    assert isinstance(data["industries"], list)
    assert data["xp"] >= 0
    assert data["level"] >= 1


def test_rate_crew(client: TestClient, auth_token: str, crew_id: str):
    """Test rating a crew."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    resp = client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 5, "comment": "Excellent work!"}
    )
    assert resp.status_code == 200
    
    data = resp.json()
    assert "rating_id" in data
    assert data["crew_id"] == crew_id
    assert data["new_rating_avg"] == 5.0
    assert data["total_ratings"] == 1


def test_update_rating(client: TestClient, auth_token: str, crew_id: str):
    """Test updating an existing rating."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # First rating
    resp1 = client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 3, "comment": "OK"}
    )
    assert resp1.status_code == 200
    rating_id_1 = resp1.json()["rating_id"]
    
    # Update rating
    resp2 = client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 5, "comment": "Actually great!"}
    )
    assert resp2.status_code == 200
    rating_id_2 = resp2.json()["rating_id"]
    
    # Should be the same rating ID (updated, not new)
    assert rating_id_1 == rating_id_2
    assert resp2.json()["new_rating_avg"] == 5.0


def test_get_crew_ratings(client: TestClient, auth_token: str, crew_id: str):
    """Test getting all ratings for a crew."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Add some ratings
    client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 5, "comment": "Great!"}
    )
    
    # Get ratings
    resp = client.get(f"/crews/{crew_id}/ratings")
    assert resp.status_code == 200
    
    ratings = resp.json()
    assert isinstance(ratings, list)
    assert len(ratings) == 1
    assert ratings[0]["rating"] == 5
    assert ratings[0]["comment"] == "Great!"


def test_rating_validation(client: TestClient, auth_token: str, crew_id: str):
    """Test rating validation (must be 1-5)."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Rating too low
    resp1 = client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 0, "comment": "Bad"}
    )
    assert resp1.status_code == 422
    
    # Rating too high
    resp2 = client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 6, "comment": "Too good"}
    )
    assert resp2.status_code == 422


def test_add_crew_xp(client: TestClient, auth_token: str, crew_id: str):
    """Test adding XP to a crew."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get initial XP
    resp1 = client.get(f"/crews/{crew_id}/portfolio")
    initial_xp = resp1.json()["xp"]
    initial_level = resp1.json()["level"]
    
    # Add XP
    resp2 = client.post(
        f"/crews/{crew_id}/add-xp?xp_amount=150",
        headers=headers
    )
    assert resp2.status_code == 200
    
    # Check updated XP
    resp3 = client.get(f"/crews/{crew_id}/portfolio")
    new_xp = resp3.json()["xp"]
    new_level = resp3.json()["level"]
    
    assert new_xp == initial_xp + 150
    # Level should increase if XP crossed threshold (100 XP per level)
    if new_xp // 100 > initial_xp // 100:
        assert new_level > initial_level


def test_rating_affects_portfolio(client: TestClient, auth_token: str, crew_id: str):
    """Test that ratings update the portfolio average."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Add rating
    client.post(
        f"/crews/{crew_id}/rate",
        headers=headers,
        json={"rating": 4, "comment": "Good"}
    )
    
    # Check portfolio reflects rating
    resp = client.get(f"/crews/{crew_id}/portfolio")
    data = resp.json()
    
    assert data["rating_avg"] == 4.0
    assert data["rating_count"] == 1


def test_pagination_ratings(client: TestClient, auth_token: str, crew_id: str):
    """Test pagination for crew ratings."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Add multiple ratings (need different users for this to work properly)
    # For now, just test the endpoint accepts limit/offset
    resp = client.get(f"/crews/{crew_id}/ratings?limit=10&offset=0")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
