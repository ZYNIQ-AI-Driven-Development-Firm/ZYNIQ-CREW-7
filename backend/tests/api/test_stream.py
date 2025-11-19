"""
Tests for Stream API endpoints (SSE).

Endpoints: /events
Router: app.routes.stream
"""
import pytest
from fastapi.testclient import TestClient


def test_stream_events_run(
    client: TestClient,
    auth_headers: dict[str, str],
    user_crew_id: str,
    user_with_credits: None
):
    """Test GET /events/runs/{run_id} (SSE endpoint)"""
    # Create a run first
    create_resp = client.post(
        f"/runs/crew/{user_crew_id}",
        headers=auth_headers,
        json={"prompt": "Test stream"}
    )
    run_id = create_resp.json()["id"]
    
    # Note: SSE endpoints return different response format
    # Just check the endpoint is accessible
    response = client.get(f"/events/runs/{run_id}", headers=auth_headers)
    assert response.status_code in [200, 202]
