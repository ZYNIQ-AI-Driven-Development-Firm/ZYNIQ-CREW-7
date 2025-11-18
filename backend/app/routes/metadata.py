"""
Metadata API Routes

Provides OpenSea-compatible NFT metadata endpoints for crews and agents.
Used by marketplaces, wallets, and NFT platforms to display Crew-7 assets.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, optional_auth, UserCtx
from app.models.crew import Crew
from app.models.agent import Agent
from app.models.web3_metadata import CrewNftMetadata, AgentNftMetadata, AgentRole
from app.services.metadata_service import crew_to_nft_metadata, agent_to_nft_metadata

router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.get("/crew/{crew_id}", response_model=CrewNftMetadata)
def get_crew_metadata(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
) -> CrewNftMetadata:
    """
    Get OpenSea-compatible NFT metadata for a crew
    
    This endpoint returns full NFT metadata including:
    - Base fields (name, description, image, external_url)
    - Crew-specific data (level, XP, missions, success rate)
    - Performance metrics (hours worked, artifacts)
    - Rarity tier and market status
    - Agent references (orchestrator + specialists)
    
    The metadata format is compatible with:
    - OpenSea marketplace
    - NFT wallets (MetaMask, Rainbow, etc.)
    - NFT aggregators
    
    **Access Control:**
    - Public crews: Anyone can view
    - Private crews: Only org members can view
    
    **Caching:**
    - Metadata is computed on-demand
    - Consider adding Redis cache for production
    
    **Example Response:**
    ```json
    {
      "name": "Crew-7 // Elite DevOps Squadron",
      "description": "Level 42 Dev crew with 97.5% success rate...",
      "image": "https://cdn.crew7.ai/crews/abc-123.png",
      "external_url": "https://app.crew7.ai/crews/abc-123",
      "attributes": [
        {"trait_type": "Level", "value": 42, "display_type": "number"},
        {"trait_type": "Rarity", "value": "Prime"}
      ],
      "crew_id": "abc-123",
      "level": 42,
      "xp": 48750,
      "success_rate": 97.5,
      "rarity_tier": "prime"
    }
    ```
    """
    
    # Fetch crew from database
    crew = db.get(Crew, crew_id)
    
    # Check existence and access
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    if not crew.is_public and (user is None or crew.org_id != user.org_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Convert to NFT metadata
    metadata = crew_to_nft_metadata(db, crew)
    
    return metadata


@router.get("/agent/{agent_id}", response_model=AgentNftMetadata)
def get_agent_metadata(
    agent_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
) -> AgentNftMetadata:
    """
    Get OpenSea-compatible NFT metadata for an agent
    
    This endpoint returns full NFT metadata for individual agents including:
    - Base fields (name, description, image, external_url)
    - Agent-specific data (role, skills, primary model)
    - Performance metrics (missions contributed, success rate)
    - Rarity tier
    - Linked crew references
    
    **Access Control:**
    - Public if crew is public
    - Private crews: Only org members can view agents
    
    **Example Response:**
    ```json
    {
      "name": "Alpha Orchestrator",
      "description": "Level 35 orchestrator agent coordinating mission execution",
      "image": "https://cdn.crew7.ai/agents/xyz-789.png",
      "role": "orchestrator",
      "level": 35,
      "skills": ["task_delegation", "workflow_optimization"],
      "missions_contributed": 425
    }
    ```
    """
    
    # Fetch agent
    agent = db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check crew access
    crew = db.get(Crew, agent.crew_id)
    if not crew or (not crew.is_public and (user is None or crew.org_id != user.org_id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Convert to NFT metadata
    metadata = agent_to_nft_metadata(db, agent)
    
    return metadata


@router.get("/crew/{crew_id}/agents", response_model=list[AgentNftMetadata])
def get_crew_agents_metadata(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
) -> list[AgentNftMetadata]:
    """
    Get NFT metadata for all agents in a crew
    
    Returns an array of agent metadata objects from the database.
    
    This endpoint is useful for:
    - Displaying full crew composition
    - NFT collection views
    - Agent marketplace listings
    
    **Access Control:**
    - Same as crew metadata endpoint
    
    **Example Response:**
    ```json
    [
      {
        "name": "Orchestrator Agent",
        "agent_id": "abc-123-xyz",
        "role": "orchestrator",
        "level": 7
      },
      {
        "name": "Engineer Agent",
        "agent_id": "def-456-xyz",
        "role": "engineer",
        "level": 6
      },
      ...
    ]
    ```
    """
    
    # Fetch crew and check access
    crew = db.get(Crew, crew_id)
    
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    if not crew.is_public and (user is None or crew.org_id != user.org_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Fetch all agents for this crew
    agents_db = db.query(Agent).filter(Agent.crew_id == crew_id).all()
    
    # Convert to NFT metadata
    agents_metadata = [agent_to_nft_metadata(db, agent) for agent in agents_db]
    
    return agents_metadata
