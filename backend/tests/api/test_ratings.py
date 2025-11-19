"""
Tests for Ratings API endpoints.

Endpoints: /ratings
Router: app.routes.ratings
"""
import pytest
from fastapi.testclient import TestClient


def test_ratings_create(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /ratings"""
    response = client.post(
        "/ratings",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "rating": 5,
            "comment": "Excellent crew!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 5
    assert data["comment"] == "Excellent crew!"


def test_ratings_update(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test PATCH /ratings/{rating_id}"""
    # Create rating first
    create_resp = client.post(
        "/ratings",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "rating": 4,
            "comment": "Good"
        }
    )
    rating_id = create_resp.json()["id"]
    
    response = client.patch(
        f"/ratings/{rating_id}",
        headers=auth_headers,
        json={"rating": 5, "comment": "Excellent!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rating"] == 5


def test_ratings_delete(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test DELETE /ratings/{rating_id}"""
    # Create rating first
    create_resp = client.post(
        "/ratings",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "rating": 4,
            "comment": "Good"
        }
    )
    rating_id = create_resp.json()["id"]
    
    response = client.delete(f"/ratings/{rating_id}", headers=auth_headers)
    assert response.status_code == 204


def test_ratings_get_for_crew(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str):
    """Test GET /ratings/crews/{crew_id}"""
    response = client.get(f"/ratings/crews/{marketplace_crew_id}", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_ratings_get_stats(client: TestClient, auth_headers: dict[str, str], marketplace_crew_id: str):
    """Test GET /ratings/crews/{crew_id}/stats"""
    response = client.get(f"/ratings/crews/{marketplace_crew_id}/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "average_rating" in data
    assert "total_ratings" in data


def test_ratings_get_my_rating(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /ratings/crews/{crew_id}/my-rating"""
    response = client.get(f"/ratings/crews/{user_crew_id}/my-rating", headers=auth_headers)
    assert response.status_code == 200
