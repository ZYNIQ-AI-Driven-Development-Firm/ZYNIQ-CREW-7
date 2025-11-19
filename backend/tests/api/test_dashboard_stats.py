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
    assert "total_crews" in data
    assert "total_runs" in data


def test_dashboard_tokens_stats(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /dashboard/tokens/stats"""
    response = client.get("/dashboard/tokens/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_tokens" in data


def test_dashboard_rentals_stats(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /dashboard/rentals/stats"""
    response = client.get("/dashboard/rentals/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "active_rentals" in data
