"""
Agent Routes

API endpoints for agent management.
"""
from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db, optional_auth
from app.schemas.agent import AgentCreate, AgentOut, AgentPatch
from app.services.agent_service import (
    create_agent,
    get_agent,
    list_crew_agents,
    update_agent,
    delete_agent
)
from app.services.limits import enforce_rate

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("", response_model=AgentOut, status_code=201)
def create(
    payload: AgentCreate,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
) -> AgentOut:
    """
    Create a new agent for a crew.
    
    - Must own the crew to add agents
    - Agent count typically limited to 7 per crew
    """
    enforce_rate(user.user_id, "agents.create", rpm=20, cap=50)
    
    agent = create_agent(db, payload, user.user_id, user.org_id)
    return AgentOut.model_validate(agent)


@router.get("/{agent_id}", response_model=AgentOut)
def get_one(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth)
) -> AgentOut:
    """
    Get an agent by ID.
    
    - Public if crew is public
    - Requires auth if crew is private
    """
    org_id = user.org_id if user else None
    agent = get_agent(db, agent_id, org_id=org_id)
    return AgentOut.model_validate(agent)


@router.get("/crews/{crew_id}/agents", response_model=list[AgentOut])
def list_by_crew(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth)
) -> list[AgentOut]:
    """
    List all agents for a crew.
    
    - Public if crew is public
    - Returns all 7 agents in the crew formation
    """
    org_id = user.org_id if user else None
    agents = list_crew_agents(db, crew_id, org_id=org_id)
    return [AgentOut.model_validate(a) for a in agents]


@router.patch("/{agent_id}", response_model=AgentOut)
def patch(
    agent_id: UUID,
    payload: AgentPatch,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
) -> AgentOut:
    """
    Update an agent.
    
    - Only crew owner can update agents
    - Can update role, name, description, config, etc.
    """
    agent = update_agent(db, agent_id, payload, user.org_id)
    return AgentOut.model_validate(agent)


@router.delete("/{agent_id}", status_code=204)
def delete(
    agent_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
):
    """
    Delete an agent.
    
    - Only crew owner can delete agents
    - Note: Crews require 7 agents, deleting may require replacement
    """
    delete_agent(db, agent_id, user.org_id)
    return None
