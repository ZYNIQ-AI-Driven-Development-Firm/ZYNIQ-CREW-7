"""
Pricing Schemas

Pydantic models for crew pricing information and breakdowns.
"""
from __future__ import annotations

from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional


class PricingFactor(BaseModel):
    """Individual pricing factor with value and multiplier."""
    value: float = Field(..., description="Factor value (e.g., level=5, rating=4.2)")
    multiplier: float = Field(..., description="Price multiplier applied (e.g., 1.4)")


class PricingFactors(BaseModel):
    """All factors contributing to crew pricing."""
    base_price: float = Field(..., description="Base rental price before multipliers")
    rarity: dict = Field(..., description="Rarity tier and multiplier")
    level: dict = Field(..., description="Crew level and multiplier")
    success_rate: dict = Field(..., description="Success rate and multiplier")
    rating: dict = Field(..., description="Average rating and multiplier")
    demand: dict = Field(..., description="Market demand and multiplier")


class PricingCalculations(BaseModel):
    """Formulas and calculations used for pricing."""
    rental_formula: str = Field(..., description="Formula for rental price")
    buyout_formula: str = Field(..., description="Formula for buyout price")
    total_multiplier: float = Field(..., description="Combined multiplier from all factors")


class PriceBreakdown(BaseModel):
    """
    Complete pricing breakdown for a crew.
    
    Shows all factors and calculations for transparency.
    """
    crew_id: str
    crew_name: str
    rental_price_per_mission: float = Field(..., description="Price per mission in C7T")
    buyout_price: float = Field(..., description="One-time purchase price in C7T")
    currency: str = "C7T"
    factors: PricingFactors
    calculations: PricingCalculations


class CrewPricing(BaseModel):
    """Simple pricing info for crew (used in listings)."""
    crew_id: UUID
    rental_price_per_mission: float
    buyout_price: float
    currency: str = "C7T"


class PricingConfig(BaseModel):
    """
    Global pricing configuration (admin view).
    
    Shows the constants and multipliers used in pricing.
    """
    base_rental_price: float = Field(..., description="Base price per mission")
    base_buyout_multiplier: float = Field(..., description="Buyout calculation multiplier")
    rarity_multipliers: dict[str, float] = Field(..., description="Multipliers by rarity tier")
    level_tiers: dict[str, float] = Field(..., description="Level ranges and multipliers")
    success_rate_tiers: dict[str, float] = Field(..., description="Success rate ranges and multipliers")
    rating_tiers: dict[str, float] = Field(..., description="Rating ranges and multipliers")
