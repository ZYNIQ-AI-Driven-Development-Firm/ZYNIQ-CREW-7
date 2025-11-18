"""
Web3 NFT Metadata Models for Crew-7 Backend

Pydantic models for representing Crews and Agents as NFT-compatible digital assets.
These models match the TypeScript interfaces defined in frontend/src/lib/web3/metadata.ts

Standards compliance:
- Base fields follow OpenSea metadata standard
- Attributes use {trait_type, value} format
- Extended with Crew-7 specific gaming/portfolio mechanics
"""

from enum import Enum
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, HttpUrl, validator


# ============================================================================
# Enums
# ============================================================================

class RarityTier(str, Enum):
    """Rarity tier classification for crews and agents"""
    COMMON = "common"
    ADVANCED = "advanced"
    ELITE = "elite"
    PRIME = "prime"


class MarketStatus(str, Enum):
    """Market listing status"""
    NOT_LISTED = "not_listed"
    FOR_RENT = "for_rent"
    FOR_SALE = "for_sale"


class CrewType(str, Enum):
    """Crew type/specialization categories"""
    DEV = "Dev"
    MARKETING = "Marketing"
    BUSINESS = "Business"
    FINANCE = "Finance"
    OPERATIONS = "Operations"
    RESEARCH = "Research"
    CUSTOM = "Custom"


class AgentRole(str, Enum):
    """Agent role within a crew"""
    ORCHESTRATOR = "orchestrator"
    ENGINEER = "engineer"
    ANALYST = "analyst"
    ARCHITECT = "architect"
    CREATIVE = "creative"
    OPERATIONS = "operations"
    FINANCE = "finance"
    CUSTOM = "custom"


# ============================================================================
# Base NFT Metadata (OpenSea Standard)
# ============================================================================

class NftAttribute(BaseModel):
    """Standard NFT attribute in OpenSea format"""
    trait_type: str
    value: str | int | float
    display_type: Optional[Literal["number", "boost_number", "boost_percentage", "date"]] = None
    max_value: Optional[int | float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "trait_type": "Level",
                "value": 7,
                "display_type": "number"
            }
        }


class BaseNftMetadata(BaseModel):
    """Base NFT metadata shared by all token types"""
    
    name: str = Field(..., description="Human-friendly name of the asset")
    description: str = Field(..., description="Rich text description of the asset's purpose and history")
    image: str = Field(..., description="URL to the asset's visual representation")
    external_url: str = Field(..., description="Link to the asset's profile page in Crew-7 app")
    attributes: List[NftAttribute] = Field(default_factory=list, description="Array of traits/attributes")
    animation_url: Optional[str] = Field(None, description="Optional animation/video URL")
    background_color: Optional[str] = Field(None, description="Optional background color (hex without #)")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Crew-7 // Atlas Dev Squad",
                "description": "A Prime-level autonomous dev crew...",
                "image": "https://cdn.crew7.ai/crews/atlas-dev-squad.png",
                "external_url": "https://app.crew7.ai/crews/atlas-dev-squad",
                "attributes": []
            }
        }


# ============================================================================
# Crew NFT Metadata
# ============================================================================

class CrewNftMetadata(BaseNftMetadata):
    """
    Complete NFT metadata for a Crew-7 AI Crew
    Represents a full 7-agent team (1 orchestrator + 6 specialists)
    """
    
    # === Core Identity ===
    crew_id: str = Field(..., description="Unique internal Crew-7 identifier")
    crew_type: CrewType = Field(..., description="Crew specialization category")
    formation: Literal[7] = Field(7, description="Always 7: 1 orchestrator + 6 specialists")
    
    # === Agent References ===
    orchestrator_ref: str = Field(..., description="Agent ID or tokenId of the orchestrator")
    specialists_ref: List[str] = Field(..., min_items=6, max_items=6, description="Array of 6 specialist IDs")
    
    # === Progression & XP ===
    level: int = Field(..., ge=1, description="Current level derived from XP")
    xp: int = Field(..., ge=0, description="Current experience points")
    xp_required_for_next_level: int = Field(..., ge=0, description="XP threshold for next level")
    
    # === Performance Metrics ===
    missions_completed: int = Field(0, ge=0, description="Total missions completed successfully")
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage (0-100)")
    client_rating: float = Field(0, ge=0, le=5, description="Average client rating (0-5 stars)")
    hours_worked_estimate: Optional[int] = Field(None, ge=0, description="Estimated total hours worked")
    artifacts_count: Optional[int] = Field(None, ge=0, description="Number of deliverables produced")
    
    # === Rarity & Economics ===
    rarity_tier: RarityTier = Field(..., description="Rarity classification")
    market_status: MarketStatus = Field(MarketStatus.NOT_LISTED, description="Current marketplace listing status")
    price_per_mission: Optional[float] = Field(None, ge=0, description="Price per mission rental")
    price_currency: Optional[str] = Field("C7T", description="Currency symbol for pricing")
    price_buyout: Optional[float] = Field(None, ge=0, description="Buyout price")
    
    # === Blockchain Identity ===
    chain_id: Optional[str] = Field(None, description="Network identifier")
    token_id: Optional[str] = Field(None, description="On-chain token ID")
    contract_address: Optional[str] = Field(None, description="Contract address")
    
    # === Metadata Version ===
    metadata_version: str = Field("1.0.0", description="Schema version")

    @validator("specialists_ref")
    def validate_specialists_count(cls, v):
        if len(v) != 6:
            raise ValueError("Must have exactly 6 specialists")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Crew-7 // Atlas Dev Squad",
                "description": "A Prime-level autonomous dev crew...",
                "image": "https://cdn.crew7.ai/crews/atlas-dev-squad.png",
                "external_url": "https://app.crew7.ai/crews/atlas-dev-squad",
                "attributes": [
                    {"trait_type": "Crew Type", "value": "Dev"},
                    {"trait_type": "Level", "value": 7, "display_type": "number"}
                ],
                "crew_id": "crew_atlas_dev_squad",
                "crew_type": "Dev",
                "formation": 7,
                "orchestrator_ref": "agent_orchestrator_atlas",
                "specialists_ref": ["agent_eng_01", "agent_arch_01", "agent_ana_01", 
                                   "agent_cre_01", "agent_ops_01", "agent_fin_01"],
                "level": 7,
                "xp": 10240,
                "xp_required_for_next_level": 18000,
                "missions_completed": 142,
                "success_rate": 94.7,
                "client_rating": 4.9,
                "rarity_tier": "prime",
                "market_status": "for_rent",
                "price_per_mission": 250,
                "price_currency": "C7T"
            }
        }


# ============================================================================
# Agent NFT Metadata
# ============================================================================

class AgentNftMetadata(BaseNftMetadata):
    """
    Complete NFT metadata for an individual AI Agent
    Can be an Orchestrator or one of 6 Specialist types
    """
    
    # === Core Identity ===
    agent_id: str = Field(..., description="Unique internal agent identifier")
    role: AgentRole = Field(..., description="Agent's role within crews")
    skills: List[str] = Field(..., min_items=1, description="Array of skill tags/capabilities")
    primary_model: str = Field(..., description="Primary LLM or model used by this agent")
    
    # === Progression & XP ===
    xp: int = Field(0, ge=0, description="Current experience points")
    level: int = Field(1, ge=1, description="Current level derived from XP")
    
    # === Performance Metrics ===
    missions_contributed: int = Field(0, ge=0, description="Number of missions contributed to")
    success_rate: float = Field(0, ge=0, le=100, description="Success rate percentage (0-100)")
    agent_rating: Optional[float] = Field(None, ge=0, le=5, description="Agent-specific rating")
    
    # === Rarity & Economics ===
    rarity_tier: RarityTier = Field(..., description="Rarity classification")
    market_status: Optional[MarketStatus] = Field(None, description="Market status if tradeable individually")
    price: Optional[float] = Field(None, ge=0, description="Individual agent price")
    price_currency: Optional[str] = Field("C7T", description="Currency for individual pricing")
    
    # === Crew Relationships ===
    linked_crew_ids: List[str] = Field(default_factory=list, description="Crew IDs this agent participates in")
    
    # === Blockchain Identity ===
    chain_id: Optional[str] = Field(None, description="Network identifier")
    token_id: Optional[str] = Field(None, description="On-chain token ID")
    contract_address: Optional[str] = Field(None, description="Contract address")
    
    # === Metadata Version ===
    metadata_version: str = Field("1.0.0", description="Schema version")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Atlas // Orchestrator",
                "description": "Prime Orchestrator of the Atlas Dev Squad...",
                "image": "https://cdn.crew7.ai/agents/orchestrator-atlas.png",
                "external_url": "https://app.crew7.ai/agents/orchestrator-atlas",
                "attributes": [
                    {"trait_type": "Role", "value": "Orchestrator"},
                    {"trait_type": "Level", "value": 7, "display_type": "number"}
                ],
                "agent_id": "agent_orchestrator_atlas",
                "role": "orchestrator",
                "skills": ["Task Decomposition", "Multi-agent Coordination"],
                "primary_model": "gpt-4-turbo",
                "xp": 5600,
                "level": 7,
                "missions_contributed": 142,
                "success_rate": 96.1,
                "rarity_tier": "prime",
                "linked_crew_ids": ["crew_atlas_dev_squad"]
            }
        }


# ============================================================================
# Helper Functions
# ============================================================================

XP_LEVEL_THRESHOLDS = [
    0,      # Level 1
    1000,   # Level 2
    2500,   # Level 3
    5000,   # Level 4
    8000,   # Level 5
    12000,  # Level 6
    18000,  # Level 7
    25000,  # Level 8
    35000,  # Level 9
    50000,  # Level 10
]


def calculate_level(xp: int) -> int:
    """Calculate level from XP"""
    for i in range(len(XP_LEVEL_THRESHOLDS) - 1, -1, -1):
        if xp >= XP_LEVEL_THRESHOLDS[i]:
            return i + 1
    return 1


def calculate_xp_for_next_level(current_xp: int) -> int:
    """Calculate XP required for next level"""
    current_level = calculate_level(current_xp)
    if current_level >= len(XP_LEVEL_THRESHOLDS):
        return XP_LEVEL_THRESHOLDS[-1]
    return XP_LEVEL_THRESHOLDS[current_level]


def calculate_rarity_tier(level: int, success_rate: float) -> RarityTier:
    """Calculate rarity tier based on level and success rate"""
    if level >= 8 and success_rate >= 90:
        return RarityTier.PRIME
    elif level >= 6 and success_rate >= 80:
        return RarityTier.ELITE
    elif level >= 4 and success_rate >= 70:
        return RarityTier.ADVANCED
    else:
        return RarityTier.COMMON
