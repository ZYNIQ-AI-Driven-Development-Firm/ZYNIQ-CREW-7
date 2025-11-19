"""
Tests for Agents API endpoints.

Endpoints: /agents
Router: app.routes.agents
"""
import pytest
from fastapi.testclient import TestClient


def test_agents_create(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test POST /agents"""
    response = client.post(
        "/agents",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "role": "custom",
            "name": "Test Agent",
            "description": "A test agent",
            "specialist_type": "tester",
            "backstory": "Testing agent",
            "goal": "Test endpoints",
            "llm_config": {"model": "gpt-4", "temperature": 0.7},
            "tools_list": "code_interpreter"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Agent"
    assert data["role"] == "custom"


def test_agents_get(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /agents/{agent_id}"""
    # Create agent first
    create_resp = client.post(
        "/agents",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "role": "custom",
            "name": "Get Test Agent",
            "description": "Test",
            "specialist_type": "tester",
            "backstory": "Test",
            "goal": "Test",
            "llm_config": {},
            "tools_list": ""
        }
    )
    agent_id = create_resp.json()["id"]
    
    response = client.get(f"/agents/{agent_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == agent_id


def test_agents_list_for_crew(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /agents/crews/{crew_id}/agents"""
    response = client.get(f"/agents/crews/{user_crew_id}/agents", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_agents_update(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test PATCH /agents/{agent_id}"""
    # Create agent
    create_resp = client.post(
        "/agents",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "role": "custom",
            "name": "Update Agent",
            "description": "Original",
            "specialist_type": "tester",
            "backstory": "Test",
            "goal": "Test",
            "llm_config": {},
            "tools_list": ""
        }
    )
    agent_id = create_resp.json()["id"]
    
    # Update agent
    response = client.patch(
        f"/agents/{agent_id}",
        headers=auth_headers,
        json={"name": "Updated Agent Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Agent Name"


def test_agents_delete(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test DELETE /agents/{agent_id}"""
    # Create agent
    create_resp = client.post(
        "/agents",
        headers=auth_headers,
        json={
            "crew_id": user_crew_id,
            "role": "custom",
            "name": "Delete Agent",
            "description": "Test",
            "specialist_type": "tester",
            "backstory": "Test",
            "goal": "Test",
            "llm_config": {},
            "tools_list": ""
        }
    )
    agent_id = create_resp.json()["id"]
    
    # Delete agent
    response = client.delete(f"/agents/{agent_id}", headers=auth_headers)
    assert response.status_code == 204
