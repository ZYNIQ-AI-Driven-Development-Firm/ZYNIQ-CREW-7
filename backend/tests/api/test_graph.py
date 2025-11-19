"""
Tests for Graph API endpoints.

Endpoints: /graph
Router: app.routes.graph
"""
import pytest
from fastapi.testclient import TestClient


def test_graph_get_crew(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /graph/{crew_id}"""
    response = client.get(f"/graph/{user_crew_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data or "graph" in data or "crew_id" in data


def test_graph_update_crew(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test PUT /graph/{crew_id}"""
    response = client.put(
        f"/graph/{user_crew_id}",
        headers=auth_headers,
        json={
            "nodes": [],
            "edges": []
        }
    )
    assert response.status_code in [200, 400]


def test_graph_pause_run(client: TestClient, auth_headers: dict[str, str], user_crew_id: str, user_with_credits: None):
    """Test POST /graph/runs/{run_id}/pause"""
    # Create run first
    run_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test"}
    )
    run_id = run_resp.json()["id"]
    
    response = client.post(f"/graph/runs/{run_id}/pause", headers=auth_headers)
    assert response.status_code in [200, 400]


def test_graph_resume_run(client: TestClient, auth_headers: dict[str, str], user_crew_id: str, user_with_credits: None):
    """Test POST /graph/runs/{run_id}/resume"""
    # Create run first
    run_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test"}
    )
    run_id = run_resp.json()["id"]
    
    response = client.post(f"/graph/runs/{run_id}/resume", headers=auth_headers)
    assert response.status_code in [200, 400]


def test_graph_cancel_run(client: TestClient, auth_headers: dict[str, str], user_crew_id: str, user_with_credits: None):
    """Test POST /graph/runs/{run_id}/cancel"""
    # Create run first
    run_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test"}
    )
    run_id = run_resp.json()["id"]
    
    response = client.post(f"/graph/runs/{run_id}/cancel", headers=auth_headers)
    assert response.status_code in [200, 400]
