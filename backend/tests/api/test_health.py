"""
Tests for Health API endpoints.

Endpoint: /health, /live, /ready
Router: app.routes.health
"""
import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test GET /health"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_liveness_check(client: TestClient):
    """Test GET /live"""
    response = client.get("/live")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_readiness_check(client: TestClient):
    """Test GET /ready"""
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"ok": True}
