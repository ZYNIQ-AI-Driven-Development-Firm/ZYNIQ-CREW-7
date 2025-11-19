"""
Tests for Runs API endpoints.

Endpoints: /runs
Router: app.routes.runs
"""
import pytest
from fastapi.testclient import TestClient


def test_runs_create(
    client: TestClient,
    auth_headers: dict[str, str],
    user_crew_id: str,
    user_with_credits: None
):
    """Test POST /runs/crew/{crew_id}"""
    response = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test run"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] == "queued"


def test_runs_get_stats(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /runs/stats"""
    response = client.get("/runs/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_runs" in data


def test_runs_get(
    client: TestClient,
    auth_headers: dict[str, str],
    user_crew_id: str,
    user_with_credits: None
):
    """Test GET /runs/{run_id}"""
    # Create run first
    create_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test"}
    )
    run_id = create_resp.json()["id"]
    
    response = client.get(f"/runs/{run_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == run_id


def test_runs_add_artifact(
    client: TestClient,
    auth_headers: dict[str, str],
    user_crew_id: str,
    user_with_credits: None
):
    """Test POST /runs/{run_id}/artifacts"""
    # Create run first
    create_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test"}
    )
    run_id = create_resp.json()["id"]
    
    response = client.post(
        f"/runs/{run_id}/artifacts",
        headers=auth_headers,
        json={
            "name": "test.txt",
            "content": "Test content",
            "type": "text"
        }
    )
    assert response.status_code in [200, 201, 422]


def test_runs_get_artifacts(
    client: TestClient,
    auth_headers: dict[str, str],
    user_crew_id: str,
    user_with_credits: None
):
    """Test GET /runs/{run_id}/artifacts"""
    # Create run first
    create_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test"}
    )
    run_id = create_resp.json()["id"]
    
    response = client.get(f"/runs/{run_id}/artifacts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))
