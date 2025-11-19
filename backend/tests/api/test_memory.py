"""
Tests for Memory API endpoints.

Endpoints: /memory
Router: app.routes.memory
"""
import pytest
from fastapi.testclient import TestClient


def test_memory_embed(client: TestClient):
    """Test POST /memory/embed"""
    response = client.post(
        "/memory/embed",
        json={"text": "Test embedding text"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert "dimension" in data


def test_memory_embed_batch(client: TestClient):
    """Test POST /memory/embed/batch"""
    response = client.post(
        "/memory/embed/batch",
        json={"texts": ["Text 1", "Text 2", "Text 3"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "embeddings" in data
    assert "count" in data
    assert data["count"] == 3


def test_memory_add_crew_memory(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /memory/crews/{crew_id}"""
    # First generate embedding
    embed_response = client.post(
        "/memory/embed",
        json={"text": "Test memory content"}
    )
    embedding = embed_response.json()["embedding"]
    
    response = client.post(
        f"/memory/crews/{user_crew_id}",
        headers=auth_headers,
        json={
            "content": "Test memory content",
            "embedding": embedding,
            "metadata": {"test": "data"},
            "agent_role": "orchestrator"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "memory_id" in data


def test_memory_search_crew(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /memory/crews/{crew_id}/search"""
    # Generate query embedding
    embed_response = client.post(
        "/memory/embed",
        json={"text": "search query"}
    )
    embedding = embed_response.json()["embedding"]
    
    response = client.post(
        f"/memory/crews/{user_crew_id}/search",
        headers=auth_headers,
        json={
            "query_embedding": embedding,
            "top_k": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_memory_crew_stats(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /memory/crews/{crew_id}/stats"""
    response = client.get(f"/memory/crews/{user_crew_id}/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "crew_id" in data
    assert "total_memories" in data


def test_memory_clear_crew(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test DELETE /memory/crews/{crew_id}"""
    response = client.delete(f"/memory/crews/{user_crew_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_memory_add_mission_memory(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /memory/missions/{mission_id}"""
    embed_response = client.post(
        "/memory/embed",
        json={"text": "Mission memory"}
    )
    embedding = embed_response.json()["embedding"]
    
    response = client.post(
        "/memory/missions/test-mission-123",
        headers=auth_headers,
        json={
            "content": "Mission memory content",
            "embedding": embedding,
            "agent_role": "developer"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "memory_id" in data


def test_memory_search_mission(client: TestClient, auth_headers: dict[str, str]):
    """Test POST /memory/missions/{mission_id}/search"""
    embed_response = client.post(
        "/memory/embed",
        json={"text": "search"}
    )
    embedding = embed_response.json()["embedding"]
    
    response = client.post(
        "/memory/missions/test-mission-123/search",
        headers=auth_headers,
        json={
            "query_embedding": embedding,
            "top_k": 5
        }
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_memory_clear_mission(client: TestClient, auth_headers: dict[str, str]):
    """Test DELETE /memory/missions/{mission_id}"""
    response = client.delete("/memory/missions/test-mission-123", headers=auth_headers)
    assert response.status_code == 200


def test_memory_batch_add(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /memory/crews/{crew_id}/batch"""
    memories = []
    for i in range(3):
        embed_resp = client.post("/memory/embed", json={"text": f"Memory {i}"})
        embedding = embed_resp.json()["embedding"]
        memories.append({
            "content": f"Memory {i}",
            "embedding": embedding,
            "agent_role": "orchestrator"
        })
    
    response = client.post(
        f"/memory/crews/{user_crew_id}/batch",
        headers=auth_headers,
        json=memories
    )
    assert response.status_code == 200
    data = response.json()
    assert "memories_added" in data
