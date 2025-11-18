"""
Agent Service

Business logic for agent management.
"""
from __future__ import annotations

from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.agent import Agent
from app.models.crew import Crew
from app.schemas.agent import AgentCreate, AgentPatch


def create_agent(
    db: Session,
    agent_data: AgentCreate,
    owner_id: str,
    org_id: str
) -> Agent:
    """
    Create a new agent for a crew.
    
    Args:
        db: Database session
        agent_data: Agent creation data
        owner_id: ID of user creating the agent
        org_id: Organization ID of the user
    
    Returns:
        Created Agent instance
    
    Raises:
        HTTPException: If crew doesn't exist or user doesn't have access
    """
    # Verify crew exists and user has access
    crew = db.get(Crew, agent_data.crew_id)
    if not crew or crew.org_id != org_id:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    # Create agent
    agent = Agent(
        crew_id=agent_data.crew_id,
        role=agent_data.role,
        name=agent_data.name,
        description=agent_data.description,
        specialist_type=agent_data.specialist_type,
        backstory=agent_data.backstory,
        goal=agent_data.goal,
        llm_config=agent_data.llm_config,
        tools_list=agent_data.tools_list
    )
    
    try:
        db.add(agent)
        db.commit()
        db.refresh(agent)
        return agent
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create agent") from e


def get_agent(
    db: Session,
    agent_id: UUID,
    org_id: str | None = None
) -> Agent:
    """
    Get an agent by ID.
    
    Args:
        db: Database session
        agent_id: Agent UUID
        org_id: Organization ID for access control (None for public access)
    
    Returns:
        Agent instance
    
    Raises:
        HTTPException: If agent not found or access denied
    """
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check access if org_id provided
    if org_id is not None:
        crew = db.get(Crew, agent.crew_id)
        if crew and not crew.is_public and crew.org_id != org_id:
            raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent


def list_crew_agents(
    db: Session,
    crew_id: UUID,
    org_id: str | None = None
) -> list[Agent]:
    """
    List all agents for a crew.
    
    Args:
        db: Database session
        crew_id: Crew UUID
        org_id: Organization ID for access control
    
    Returns:
        List of Agent instances
    
    Raises:
        HTTPException: If crew not found or access denied
    """
    # Verify crew exists and access
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    if org_id is not None and not crew.is_public and crew.org_id != org_id:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    # Get agents
    agents = db.query(Agent).filter(Agent.crew_id == crew_id).all()
    return agents


def update_agent(
    db: Session,
    agent_id: UUID,
    update_data: AgentPatch,
    org_id: str
) -> Agent:
    """
    Update an agent.
    
    Args:
        db: Database session
        agent_id: Agent UUID
        update_data: Fields to update
        org_id: Organization ID (must own the crew)
    
    Returns:
        Updated Agent instance
    
    Raises:
        HTTPException: If agent not found or access denied
    """
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check crew ownership
    crew = db.get(Crew, agent.crew_id)
    if not crew or crew.org_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this agent")
    
    # Update fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    
    db.commit()
    db.refresh(agent)
    return agent


def delete_agent(
    db: Session,
    agent_id: UUID,
    org_id: str
) -> bool:
    """
    Delete an agent.
    
    Args:
        db: Database session
        agent_id: Agent UUID
        org_id: Organization ID (must own the crew)
    
    Returns:
        True if deleted successfully
    
    Raises:
        HTTPException: If agent not found or access denied
    """
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check crew ownership
    crew = db.get(Crew, agent.crew_id)
    if not crew or crew.org_id != org_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this agent")
    
    db.delete(agent)
    db.commit()
    return True


def create_default_agents_for_crew(
    db: Session,
    crew: Crew
) -> list[Agent]:
    """
    Create default 7-agent formation for a new crew.
    
    Creates:
    - 1 Orchestrator
    - 6 Specialists (configurable based on crew type)
    
    Args:
        db: Database session
        crew: Crew instance
    
    Returns:
        List of created Agent instances
    """
    agents = []
    
    # Orchestrator
    orchestrator = Agent(
        crew_id=crew.id,
        role="orchestrator",
        name=f"{crew.name} Orchestrator",
        description="Coordinates and manages the crew workflow",
        specialist_type="workflow_management",
        goal="Ensure efficient task distribution and completion"
    )
    agents.append(orchestrator)
    
    # 6 Specialists - customize based on crew role
    specialist_roles = _get_specialist_roles_for_crew_type(crew.role)
    
    for i, (role, specialist_type, description) in enumerate(specialist_roles, 1):
        specialist = Agent(
            crew_id=crew.id,
            role=role,
            name=f"{crew.name} {role.title()}",
            description=description,
            specialist_type=specialist_type,
            goal=f"Excel at {specialist_type}"
        )
        agents.append(specialist)
    
    # Add all agents to database
    for agent in agents:
        db.add(agent)
    
    db.commit()
    
    # Refresh all agents
    for agent in agents:
        db.refresh(agent)
    
    return agents


def _get_specialist_roles_for_crew_type(crew_role: str) -> list[tuple[str, str, str]]:
    """
    Get specialist roles based on crew type.
    
    Returns list of (role, specialist_type, description) tuples.
    """
    # Default specialists for most crews
    default_specialists = [
        ("researcher", "research", "Conducts in-depth research and analysis"),
        ("analyst", "analysis", "Analyzes data and provides insights"),
        ("writer", "content_creation", "Creates high-quality written content"),
        ("reviewer", "quality_assurance", "Reviews and validates outputs"),
        ("coordinator", "coordination", "Coordinates with external systems"),
        ("specialist", "domain_expert", "Provides domain-specific expertise"),
    ]
    
    # Customize for specific crew types
    if crew_role and "dev" in crew_role.lower():
        return [
            ("architect", "system_design", "Designs system architecture"),
            ("developer", "implementation", "Implements code and features"),
            ("tester", "testing", "Tests code and finds bugs"),
            ("reviewer", "code_review", "Reviews code quality"),
            ("devops", "deployment", "Handles deployment and ops"),
            ("security", "security_audit", "Ensures security best practices"),
        ]
    elif crew_role and "market" in crew_role.lower():
        return [
            ("strategist", "strategy", "Develops marketing strategies"),
            ("content", "content", "Creates marketing content"),
            ("analyst", "analytics", "Analyzes campaign performance"),
            ("designer", "design", "Creates visual assets"),
            ("copywriter", "copywriting", "Writes compelling copy"),
            ("social", "social_media", "Manages social media"),
        ]
    
    return default_specialists
