"""
Tests for Auth API endpoints.

Endpoints: /auth/register, /auth/login, /auth/me
Router: app.routes.auth
"""
import pytest
from fastapi.testclient import TestClient


def test_auth_register(client: TestClient):
    """Test POST /auth/register"""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecurePass123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    # Verify it's a valid UUID string
    import uuid
    uuid.UUID(data["id"])


def test_auth_login(client: TestClient):
    """Test POST /auth/login"""
    # Register first
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "Pass123!"}
    )
    
    # Login
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "Pass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access" in data
    assert "refresh" in data


def test_auth_me(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /auth/me"""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert data["email"] == "test@example.com"
