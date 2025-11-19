"""
Tests for Billing API endpoints.

Endpoints: /billing
Router: app.routes.billing
"""
import pytest
from fastapi.testclient import TestClient


def test_billing_get_wallet(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /billing/wallet"""
    response = client.get("/billing/wallet", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "credits" in data


def test_billing_checkout(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /billing/checkout"""
    response = client.post(
        "/billing/checkout",
        headers=auth_headers,
        json={"credits": 100}
    )
    assert response.status_code in [200, 400]


def test_billing_webhook(client: TestClient):
    """Test POST /billing/webhook"""
    # Note: This is typically called by Stripe, not by users
    response = client.post(
        "/billing/webhook",
        json={},
        headers={"stripe-signature": "test"}
    )
    # Just checking endpoint exists
    assert response.status_code in [200, 400, 401]
