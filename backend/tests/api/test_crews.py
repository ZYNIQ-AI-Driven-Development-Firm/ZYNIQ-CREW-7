"""
Tests for Crews API endpoints.

Endpoints: /crews
Router: app.routes.crews
"""
import pytest
from fastapi.testclient import TestClient


def test_crews_create(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /crews"""
    response = client.post(
        "/crews",
        headers=auth_headers,
        json={
            "name": "Test Crew",
            "role": "development",
            "is_public": True,
            "recipe_json": {},
            "models_json": {},
            "tools_json": {},
            "env_json": {}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Crew"
    assert data["role"] == "development"


def test_crews_list(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /crews"""
    response = client.get("/crews", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_crews_get(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /crews/{crew_id}"""
    response = client.get(f"/crews/{user_crew_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_crew_id


def test_crews_update(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test PATCH /crews/{crew_id}"""
    response = client.patch(
        f"/crews/{user_crew_id}",
        headers=auth_headers,
        json={"name": "Updated Crew Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Crew Name"


def test_crews_fork(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str):
    """Test POST /crews/{crew_id}/fork"""
    response = client.post(
        f"/crews/{marketplace_crew_id}/fork",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data


def test_crews_get_metrics(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /crews/{crew_id}/metrics"""
    response = client.get(f"/crews/{user_crew_id}/metrics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_runs" in data


def test_crews_create_apikey(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /crews/{crew_id}/apikey"""
    response = client.post(f"/crews/{user_crew_id}/apikey", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "api_key" in data


def test_crews_fullstack_run(client: TestClient, auth_headers: dict[str, str], user_crew_id: str, user_with_credits: None):
    """Test POST /crews/fullstack/run"""
    response = client.post(
        "/crews/fullstack/run",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "prompt": "Build a simple web app"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
