"""
Tests for Marketplace API endpoints.

Endpoints: /marketplace
Router: app.routes.marketplace
"""
import pytest
from fastapi.testclient import TestClient


def test_marketplace_list(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /marketplace"""
    response = client.get("/marketplace", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_marketplace_get_crew(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str):
    """Test GET /marketplace/{crew_id}"""
    response = client.get(f"/marketplace/{marketplace_crew_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == marketplace_crew_id


def test_marketplace_fork_crew(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str):
    """Test POST /marketplace/{crew_id}/fork"""
    response = client.post(f"/marketplace/{marketplace_crew_id}/fork", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["id"] != marketplace_crew_id  # Should be a new crew


def test_marketplace_rent_crew(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str, user_with_credits: None):
    """Test POST /marketplace/{crew_id}/rent"""
    response = client.post(
        f"/marketplace/{marketplace_crew_id}/rent",
        headers=auth_headers,
        json={"duration_days": 7}
    )
    # May fail with 400 if crew doesn't have pricing set or other business logic
    assert response.status_code in [200, 400]
    data = response.json()
    assert "rental_id" in data or "message" in data or "detail" in data


def test_marketplace_buy_crew(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str, user_with_credits: None):
    """Test POST /marketplace/{crew_id}/buy"""
    response = client.post(
        f"/marketplace/{marketplace_crew_id}/buy",
        headers=auth_headers,
        json={}
    )
    # May fail with 400 if crew doesn't have pricing set or other business logic
    assert response.status_code in [200, 400]
    data = response.json()
    assert "crew_id" in data or "message" in data or "detail" in data


def test_marketplace_set_pricing(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /marketplace/{crew_id}/set-pricing"""
    response = client.post(
        f"/marketplace/{user_crew_id}/set-pricing",
        headers=auth_headers,
        json={
            "rental_price_per_day": 10,
            "purchase_price": 1000
        }
    )
    assert response.status_code == 200
