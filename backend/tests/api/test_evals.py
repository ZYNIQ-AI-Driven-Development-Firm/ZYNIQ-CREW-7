"""
Tests for Evals API endpoints.

Endpoints: /evals
Router: app.routes.evals
"""
import pytest
from fastapi.testclient import TestClient


def test_evals_create_cases(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /evals/{crew_id}/cases"""
    response = client.post(
        f"/evals/{user_crew_id}/cases",
        headers=auth_headers,
        json={
            "cases": [
                {"input": "Test input 1", "expected_output": "Test output 1"},
                {"input": "Test input 2", "expected_output": "Test output 2"}
            ]
        }
    )
    # Check endpoint exists
    assert response.status_code in [200, 201, 400, 422]


def test_evals_run(client: TestClient, auth_headers: dict[str, str], user_crew_id: str, user_with_credits: None):
    """Test POST /evals/{crew_id}/run"""
    response = client.post(
        f"/evals/{user_crew_id}/run",
        headers=auth_headers,
        json={}
    )
    # Check endpoint exists
    assert response.status_code in [200, 400, 422]
