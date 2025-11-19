"""
Tests for Dashboard Stats API endpoints.

Endpoints: /dashboard
Router: app.routes.dashboard_stats
"""
import pytest
from fastapi.testclient import TestClient


def test_dashboard_stats(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /dashboard/stats"""
    response = client.get("/dashboard/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "user_crews_count" in data
    assert "user_runs_count" in data
    assert "user_c7t_balance" in data


def test_dashboard_tokens_stats(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /dashboard/tokens/stats"""
    response = client.get("/dashboard/tokens/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "balance" in data
    assert "total_earned" in data
    assert "total_spent" in data


def test_dashboard_rentals_stats(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /dashboard/rentals/stats"""
    response = client.get("/dashboard/rentals/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "active_rentals_as_renter" in data
    assert "active_rentals_as_owner" in data
