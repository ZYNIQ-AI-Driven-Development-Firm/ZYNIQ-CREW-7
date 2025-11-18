"""
Metadata Service

Converts Crew-7 database models to Web3 NFT metadata format.
Provides OpenSea-compatible JSON representations of crews and agents.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.crew import Crew
from app.models.run import Run
from app.models.agent import Agent
from app.models.web3_metadata import (
    CrewNftMetadata,
    AgentNftMetadata,
    NftAttribute,
    RarityTier,
    MarketStatus,
    CrewType,
    AgentRole,
)
from app.services.cache_service import get_cache_service
from app.services.rating_service import get_average_rating
from app.utils.crew_calculations import (
    calculate_level,
    calculate_xp_for_next_level,
    calculate_rarity_tier,
    XP_LEVEL_THRESHOLDS
)


def _get_rental_price(db: Session, crew: Crew, use_cache: bool = True) -> float:
    """Lazy import to avoid circular dependency"""
    from app.services.pricing_service import calculate_rental_price
    return calculate_rental_price(db, crew, use_cache=use_cache)


def _get_buyout_price(db: Session, crew: Crew, use_cache: bool = True) -> float:
    """Lazy import to avoid circular dependency"""
    from app.services.pricing_service import calculate_buyout_price
    return calculate_buyout_price(db, crew, use_cache=use_cache)


def crew_to_nft_metadata(
    db: Session,
    crew: Crew,
    base_url: str = "https://app.crew7.ai",
    cdn_url: str = "https://cdn.crew7.ai",
    use_cache: bool = True
) -> CrewNftMetadata:
    """
    Convert a Crew database model to NFT metadata
    
    Args:
        db: Database session
        crew: Crew model instance
        base_url: Base URL for external_url
        cdn_url: CDN URL for images
        use_cache: Whether to use Redis cache (default: True)
    
    Returns:
        CrewNftMetadata instance
    """
    
    # Check cache first
    if use_cache:
        cache = get_cache_service()
        cached_metadata = cache.get_crew_metadata(crew.id)
        if cached_metadata:
            # Return cached metadata as Pydantic model
            return CrewNftMetadata(**cached_metadata)
    
    # Calculate performance metrics from runs
    runs = db.query(Run).filter(Run.crew_id == crew.id).all()
    total_missions = len(runs)
    completed_missions = len([r for r in runs if r.status == "completed"])
    failed_missions = len([r for r in runs if r.status == "failed"])
    
    # Calculate success rate
    success_rate = (completed_missions / total_missions * 100) if total_missions > 0 else 0
    
    # Calculate XP (100 XP per successful mission)
    xp = completed_missions * 100
    level = calculate_level(xp)
    xp_for_next_level = calculate_xp_for_next_level(xp)
    
    # Calculate rarity
    rarity_tier = calculate_rarity_tier(level, success_rate)
    
    # Estimate hours worked (2.5h average per mission)
    hours_worked = int(total_missions * 2.5)
    
    # Map crew role to type
    crew_type_map = {
        "dev": CrewType.DEV,
        "marketing": CrewType.MARKETING,
        "business": CrewType.BUSINESS,
        "finance": CrewType.FINANCE,
        "operations": CrewType.OPERATIONS,
        "research": CrewType.RESEARCH,
    }
    crew_type = crew_type_map.get(crew.role.lower() if crew.role else "", CrewType.CUSTOM)
    
    # Build attributes array
    attributes = [
        NftAttribute(trait_type="Crew Type", value=crew_type.value),
        NftAttribute(trait_type="Level", value=level, display_type="number"),
        NftAttribute(trait_type="Rarity", value=rarity_tier.value.capitalize()),
        NftAttribute(trait_type="Formation", value=7, display_type="number"),
        NftAttribute(trait_type="Missions Completed", value=completed_missions, display_type="number"),
        NftAttribute(trait_type="Success Rate", value=f"{success_rate:.1f}%"),
    ]
    
    # Generate agent references (mock for now - would come from actual agent models)
    orchestrator_ref = f"{crew.id}-orchestrator"
    specialists_ref = [f"{crew.id}-specialist-{i}" for i in range(1, 7)]
    
    # Determine market status
    market_status = MarketStatus.NOT_LISTED  # Default
    if crew.is_public:
        market_status = MarketStatus.FOR_RENT
    
    metadata = CrewNftMetadata(
        # Base NFT fields
        name=f"Crew-7 // {crew.name}",
        description=f"Level {level} {crew_type.value} crew with {success_rate:.1f}% success rate across {total_missions} missions.",
        image=f"{cdn_url}/crews/{crew.id}.png",
        external_url=f"{base_url}/crews/{crew.id}",
        attributes=attributes,
        
        # Crew-specific fields
        crew_id=str(crew.id),
        crew_type=crew_type,
        formation=7,
        orchestrator_ref=orchestrator_ref,
        specialists_ref=specialists_ref,
        
        # Progression
        level=level,
        xp=xp,
        xp_required_for_next_level=xp_for_next_level,
        
        # Performance
        missions_completed=completed_missions,
        success_rate=success_rate,
        client_rating=get_average_rating(db, crew.id, use_cache=True),
        hours_worked_estimate=hours_worked,
        artifacts_count=completed_missions * 2,  # Estimate 2 artifacts per mission
        
        # Economics
        rarity_tier=rarity_tier,
        market_status=market_status,
        price_per_mission=_get_rental_price(db, crew, use_cache),
        price_currency="C7T",
        price_buyout=_get_buyout_price(db, crew, use_cache),
        
        # Blockchain (not implemented yet)
        chain_id=None,
        token_id=None,
        contract_address=None,
        
        # Version
        metadata_version="1.0.0"
    )
    
    # Cache the result
    if use_cache:
        cache = get_cache_service()
        cache.set_crew_metadata(crew.id, metadata.model_dump())
    
    return metadata


def agent_to_nft_metadata(
    db: Session,
    agent: Agent,
    base_url: str = "https://app.crew7.ai",
    cdn_url: str = "https://cdn.crew7.ai"
) -> AgentNftMetadata:
    """
    Convert agent database model to NFT metadata.
    
    Args:
        db: Database session
        agent: Agent model instance
        base_url: Base URL for external_url
        cdn_url: CDN URL for images
    
    Returns:
        AgentNftMetadata instance
    """
    # Get crew for context
    crew = db.get(Crew, agent.crew_id)
    if not crew:
        raise ValueError(f"Crew {agent.crew_id} not found for agent {agent.id}")
    
    # For now, use crew metrics as proxy for agent performance
    # In the future, could track agent-specific contributions
    runs = db.query(Run).filter(Run.crew_id == crew.id).all()
    total_missions = len(runs)
    completed_missions = len([r for r in runs if r.status == "completed"])
    
    # Calculate success rate
    success_rate = (completed_missions / total_missions * 100) if total_missions > 0 else 0
    
    # Agents share crew XP for now
    xp = completed_missions * 100
    level = calculate_level(xp)
    
    # Get rarity tier
    rarity_tier = calculate_rarity_tier(level, success_rate)
    
    # Map agent role to AgentRole enum
    try:
        role_enum = AgentRole(agent.role.lower())
    except ValueError:
        role_enum = AgentRole.CUSTOM
    
    # Build attributes
    attributes = [
        NftAttribute(trait_type="Role", value=agent.role.capitalize()),
        NftAttribute(trait_type="Level", value=level, display_type="number"),
        NftAttribute(trait_type="Rarity", value=rarity_tier.value.capitalize()),
        NftAttribute(trait_type="Missions Contributed", value=completed_missions, display_type="number"),
        NftAttribute(trait_type="Success Rate", value=f"{success_rate:.1f}%"),
    ]
    
    if agent.specialist_type:
        attributes.append(
            NftAttribute(trait_type="Specialization", value=agent.specialist_type.replace("_", " ").title())
        )
    
    # Parse skills from tools_list
    skills = []
    if agent.tools_list:
        skills = [tool.strip() for tool in agent.tools_list.split(",") if tool.strip()]
    
    return AgentNftMetadata(
        # Base NFT fields
        name=agent.name,
        description=agent.description or f"Level {level} {agent.role} agent in the {crew.name} crew.",
        image=f"{cdn_url}/agents/{agent.id}.png",
        external_url=f"{base_url}/agents/{agent.id}",
        attributes=attributes,
        
        # Agent-specific fields
        agent_id=str(agent.id),
        role=role_enum,
        skills=skills,
        primary_model="gpt-4",  # TODO: Parse from llm_config
        
        # Progression
        xp=xp,
        level=level,
        
        # Performance
        missions_contributed=completed_missions,
        success_rate=success_rate,
        agent_rating=None,  # TODO: Implement agent-specific ratings
        
        # Rarity & Economics
        rarity_tier=rarity_tier,
        market_status=None,
        price=None,
        price_currency="C7T",
        
        # Crew Relationships
        linked_crew_ids=[str(crew.id)],
        
        # Blockchain
        chain_id=None,
        token_id=None,
        contract_address=None,
        
        # Version
        metadata_version="1.0.0"
    )
