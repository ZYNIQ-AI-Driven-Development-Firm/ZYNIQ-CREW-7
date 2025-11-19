"""
Tests for Settings API endpoints.

Endpoints: /settings
Router: app.routes.settings
"""
import pytest
from fastapi.testclient import TestClient


def test_settings_get_account(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /settings/account"""
    response = client.get("/settings/account", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data


def test_settings_update_account(client: TestClient, auth_headers: dict[str, str]):
    """Test PATCH /settings/account"""
    response = client.patch(
        "/settings/account",
        headers=auth_headers,
        json={"display_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Test User"


def test_settings_delete_account_request(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /settings/account/delete-request"""
    response = client.post(
        "/settings/account/delete-request",
        headers=auth_headers,
        json={}
    )
    assert response.status_code == 200


def test_settings_get_org(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /settings/org"""
    response = client.get("/settings/org", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "name" in data


def test_settings_update_org(client: TestClient, auth_headers: dict[str, str]):
    """Test PATCH /settings/org"""
    response = client.patch(
        "/settings/org",
        headers=auth_headers,
        json={"name": "Updated Org Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Org Name"


def test_settings_get_security(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /settings/security"""
    response = client.get("/settings/security", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "mfa_enabled" in data


def test_settings_update_security(client: TestClient, auth_headers: dict[str, str]):
    """Test PATCH /settings/security"""
    response = client.patch(
        "/settings/security",
        headers=auth_headers,
        json={"mfa_enabled": False}
    )
    assert response.status_code == 200


def test_settings_saml_config(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /settings/security/saml"""
    response = client.post(
        "/settings/security/saml",
        headers=auth_headers,
        json={
            "entity_id": "test",
            "sso_url": "https://sso.example.com"
        }
    )
    assert response.status_code in [200, 400]


def test_settings_get_integrations(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /settings/integrations"""
    response = client.get("/settings/integrations", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_settings_update_webhook(client: TestClient, auth_headers: dict[str, str]):
    """Test PATCH /settings/integrations/webhook"""
    response = client.patch(
        "/settings/integrations/webhook",
        headers=auth_headers,
        json={"webhook_url": "https://webhook.example.com"}
    )
    assert response.status_code in [200, 400]


def test_settings_get_notifications(client: TestClient, auth_headers: dict[str, str]):
    """Test GET /settings/notifications"""
    response = client.get("/settings/notifications", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email_notifications" in data


def test_settings_update_notifications(client: TestClient, auth_headers: dict[str, str]):
    """Test PATCH /settings/notifications"""
    response = client.patch(
        "/settings/notifications",
        headers=auth_headers,
        json={"email_notifications": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email_notifications"] == True
