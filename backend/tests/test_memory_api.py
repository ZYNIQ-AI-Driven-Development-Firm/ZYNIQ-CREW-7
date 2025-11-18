"""
Test memory API - Qdrant vector memory integration.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_generate_embedding(client: TestClient):
    """Test embedding generation."""
    response = client.post(
        "/memory/embed",
        json={"text": "Build a SaaS application with user authentication"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert "dimension" in data
    assert isinstance(data["embedding"], list)
    assert len(data["embedding"]) > 0


def test_generate_embeddings_batch(client: TestClient):
    """Test batch embedding generation."""
    texts = [
        "Create a FastAPI backend",
        "Build a React frontend",
        "Deploy with Docker"
    ]
    response = client.post(
        "/memory/embed/batch",
        json={"texts": texts}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 3
    assert len(data["embeddings"]) == 3


def test_add_crew_memory(client: TestClient, auth_header: dict[str, str]):
    """Test adding memory to a crew."""
    # First generate embedding
    embed_response = client.post(
        "/memory/embed",
        json={"text": "Designed REST API with JWT authentication"}
    )
    embedding = embed_response.json()["embedding"]
    
    # Add memory to crew
    response = client.post(
        "/memory/crews/test-crew-123",
        headers=auth_header,
        json={
            "content": "Designed REST API with JWT authentication",
            "embedding": embedding,
            "metadata": {"decision": "auth_strategy"},
            "agent_role": "backend_architect",
            "mission_id": "mission-abc-123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "memory_id" in data
    assert data["crew_id"] == "test-crew-123"


def test_search_crew_memory(client: TestClient, auth_header: dict[str, str]):
    """Test searching crew memory."""
    # Add some memories first
    embed1 = client.post("/memory/embed", json={"text": "Used PostgreSQL for database"}).json()["embedding"]
    embed2 = client.post("/memory/embed", json={"text": "Implemented JWT tokens"}).json()["embedding"]
    
    client.post(
        "/memory/crews/test-crew-456",
        headers=auth_header,
        json={
            "content": "Used PostgreSQL for database",
            "embedding": embed1,
            "agent_role": "backend_dev"
        }
    )
    
    client.post(
        "/memory/crews/test-crew-456",
        headers=auth_header,
        json={
            "content": "Implemented JWT tokens for authentication",
            "embedding": embed2,
            "agent_role": "backend_dev"
        }
    )
    
    # Search for database-related memories
    query_embed = client.post("/memory/embed", json={"text": "database schema"}).json()["embedding"]
    
    response = client.post(
        "/memory/crews/test-crew-456/search",
        headers=auth_header,
        json={
            "query_embedding": query_embed,
            "top_k": 2
        }
    )
    
    assert response.status_code == 200
    results = response.json()
    assert isinstance(results, list)
    if len(results) > 0:
        assert "content" in results[0]
        assert "score" in results[0]
        assert "timestamp" in results[0]


def test_crew_memory_stats(client: TestClient, auth_header: dict[str, str]):
    """Test getting crew memory statistics."""
    response = client.get(
        "/memory/crews/test-crew-789/stats",
        headers=auth_header
    )
    assert response.status_code == 200
    data = response.json()
    assert "crew_id" in data
    assert "total_memories" in data
    assert "collection_name" in data


def test_add_mission_memory(client: TestClient, auth_header: dict[str, str]):
    """Test adding memory to a specific mission."""
    embed = client.post(
        "/memory/embed",
        json={"text": "Created user registration endpoint"}
    ).json()["embedding"]
    
    response = client.post(
        "/memory/missions/mission-xyz-789",
        headers=auth_header,
        json={
            "content": "Created user registration endpoint at POST /api/auth/register",
            "embedding": embed,
            "metadata": {"endpoint": "/api/auth/register", "method": "POST"},
            "agent_role": "backend_implementer"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "memory_id" in data
    assert data["mission_id"] == "mission-xyz-789"


def test_search_mission_memory(client: TestClient, auth_header: dict[str, str]):
    """Test searching mission-specific memory."""
    # Add memories
    embed1 = client.post("/memory/embed", json={"text": "Login endpoint created"}).json()["embedding"]
    embed2 = client.post("/memory/embed", json={"text": "Password reset flow implemented"}).json()["embedding"]
    
    client.post(
        "/memory/missions/mission-search-test",
        headers=auth_header,
        json={"content": "Login endpoint created", "embedding": embed1, "agent_role": "backend_dev"}
    )
    
    client.post(
        "/memory/missions/mission-search-test",
        headers=auth_header,
        json={"content": "Password reset flow implemented", "embedding": embed2, "agent_role": "backend_dev"}
    )
    
    # Search
    query_embed = client.post("/memory/embed", json={"text": "authentication endpoints"}).json()["embedding"]
    
    response = client.post(
        "/memory/missions/mission-search-test/search",
        headers=auth_header,
        json={"query_embedding": query_embed, "top_k": 5}
    )
    
    assert response.status_code == 200
    results = response.json()
    assert isinstance(results, list)


def test_batch_crew_memories(client: TestClient, auth_header: dict[str, str]):
    """Test adding multiple memories at once."""
    memories = []
    
    for text in ["Decision 1", "Decision 2", "Decision 3"]:
        embed = client.post("/memory/embed", json={"text": text}).json()["embedding"]
        memories.append({
            "content": text,
            "embedding": embed,
            "agent_role": "orchestrator"
        })
    
    response = client.post(
        "/memory/crews/batch-test-crew/batch",
        headers=auth_header,
        json=memories
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["memories_added"] == 3
    assert len(data["memory_ids"]) == 3


def test_memory_with_filters(client: TestClient, auth_header: dict[str, str]):
    """Test searching memory with role and mission filters."""
    embed1 = client.post("/memory/embed", json={"text": "Backend decision"}).json()["embedding"]
    embed2 = client.post("/memory/embed", json={"text": "Frontend decision"}).json()["embedding"]
    
    # Add memories with different roles
    client.post(
        "/memory/crews/filter-test-crew",
        headers=auth_header,
        json={
            "content": "Backend decision: Use PostgreSQL",
            "embedding": embed1,
            "agent_role": "backend_architect",
            "mission_id": "mission-1"
        }
    )
    
    client.post(
        "/memory/crews/filter-test-crew",
        headers=auth_header,
        json={
            "content": "Frontend decision: Use React",
            "embedding": embed2,
            "agent_role": "frontend_architect",
            "mission_id": "mission-2"
        }
    )
    
    # Search with role filter
    query_embed = client.post("/memory/embed", json={"text": "architecture decisions"}).json()["embedding"]
    
    response = client.post(
        "/memory/crews/filter-test-crew/search",
        headers=auth_header,
        json={
            "query_embedding": query_embed,
            "top_k": 5,
            "agent_role": "backend_architect"
        }
    )
    
    assert response.status_code == 200
    results = response.json()
    # Should only return backend memories
    for result in results:
        if result["agent_role"]:
            assert result["agent_role"] == "backend_architect"


def test_clear_crew_memory(client: TestClient, auth_header: dict[str, str]):
    """Test clearing crew memory (dangerous operation)."""
    # Add a memory
    embed = client.post("/memory/embed", json={"text": "Test memory"}).json()["embedding"]
    client.post(
        "/memory/crews/clear-test-crew",
        headers=auth_header,
        json={"content": "Test memory", "embedding": embed}
    )
    
    # Clear all memories
    response = client.delete(
        "/memory/crews/clear-test-crew",
        headers=auth_header
    )
    
    assert response.status_code == 200
    assert "Cleared all memories" in response.json()["message"]
    
    # Verify memories are gone
    stats = client.get("/memory/crews/clear-test-crew/stats", headers=auth_header).json()
    assert stats["total_memories"] == 0


def test_clear_mission_memory(client: TestClient, auth_header: dict[str, str]):
    """Test clearing mission memory."""
    # Add a memory
    embed = client.post("/memory/embed", json={"text": "Mission decision"}).json()["embedding"]
    client.post(
        "/memory/missions/clear-mission-test",
        headers=auth_header,
        json={"content": "Mission decision", "embedding": embed}
    )
    
    # Clear mission memories
    response = client.delete(
        "/memory/missions/clear-mission-test",
        headers=auth_header
    )
    
    assert response.status_code == 200
    assert "Cleared all memories" in response.json()["message"]
