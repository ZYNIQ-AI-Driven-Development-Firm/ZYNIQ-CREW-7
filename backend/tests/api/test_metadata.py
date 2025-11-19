"""
Tests for Metadata API endpoints (NFT).

Endpoints: /metadata
Router: app.routes.metadata
"""
import pytest
from fastapi.testclient import TestClient
from app.infra.db import SessionLocal


def test_metadata_crew(client: TestClient):
    """Test GET /metadata/crew/{crew_id}"""
    # Get a public marketplace crew
    with SessionLocal() as session:
        from app.models.crew import Crew
        public_crew = session.query(Crew).filter(Crew.is_public == True).first()
        
        if public_crew:
            response = client.get(f"/metadata/crew/{public_crew.id}")
            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "image" in data
            assert "attributes" in data


def test_metadata_agent(client: TestClient, auth_headers: dict[str, str], user_crew_id: str):
    """Test GET /metadata/agent/{agent_id}"""
    # Get agents for the crew
    agents_resp = client.get(f"/agents/crews/{user_crew_id}/agents", headers=auth_headers)
    agents = agents_resp.json()
    
    if agents:
        agent_id = agents[0]["id"]
        response = client.get(f"/metadata/agent/{agent_id}")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "role" in data


def test_metadata_crew_agents(client: TestClient):
    """Test GET /metadata/crew/{crew_id}/agents"""
    # Get a public marketplace crew
    with SessionLocal() as session:
        from app.models.crew import Crew
        public_crew = session.query(Crew).filter(Crew.is_public == True).first()
        
        if public_crew:
            response = client.get(f"/metadata/crew/{public_crew.id}/agents")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
