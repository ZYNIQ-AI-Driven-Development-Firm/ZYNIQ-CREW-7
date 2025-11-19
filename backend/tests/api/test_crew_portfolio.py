"""
Tests for Crew Portfolio API endpoints.

Endpoints: /crews/{crew_id}/portfolio, /crews/{crew_id}/rate, etc.
Router: app.routes.crew_portfolio
"""
import pytest
from fastapi.testclient import TestClient


def test_crew_portfolio_get(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /crews/{crew_id}/portfolio"""
    response = client.get(f"/crews/{user_crew_id}/portfolio", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "crew" in data
    assert "stats" in data


def test_crew_portfolio_rate(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /crews/{crew_id}/rate"""
    response = client.post(
        f"/crews/{user_crew_id}/rate",
        headers=auth_headers,
        json={
            "rating": 5,
            "comment": "Great crew!"
        }
    )
    assert response.status_code == 200


def test_crew_portfolio_get_ratings(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /crews/{crew_id}/ratings"""
    response = client.get(f"/crews/{user_crew_id}/ratings", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_crew_portfolio_add_xp(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /crews/{crew_id}/add-xp"""
    response = client.post(
        f"/crews/{user_crew_id}/add-xp",
        headers=auth_headers,
        json={"xp_amount": 100}
    )
    assert response.status_code == 200
