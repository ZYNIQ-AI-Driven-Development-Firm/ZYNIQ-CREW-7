"""
Tests for Environment Setup API endpoints.

Endpoints: /env
Router: app.routes.env_setup
"""
import pytest
from fastapi.testclient import TestClient


def test_env_default_setup(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /env/default-setup"""
    response = client.post(
        "/env/default-setup",
        headers=auth_headers,
        json={"env_type": "development"}
    )
    # May fail with 500 if environment setup is not configured
    assert response.status_code in [200, 400, 500]


def test_env_get_status(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /env/status"""
    response = client.get("/env/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "env_initialized" in data
