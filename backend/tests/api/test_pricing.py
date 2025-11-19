"""
Tests for Pricing API endpoints.

Endpoints: /pricing
Router: app.routes.pricing
"""
import pytest
from fastapi.testclient import TestClient


def test_pricing_get_crew(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str):
    """Test GET /pricing/crews/{crew_id}"""
    response = client.get(f"/pricing/crews/{marketplace_crew_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "crew_id" in data or "buyout_price" in data


def test_pricing_get_config(client: TestClient):
    """Test GET /pricing/config"""
    response = client.get("/pricing/config")
    assert response.status_code == 200
    data = response.json()
    assert "base_rental_price" in data or "rarity_multipliers" in data
