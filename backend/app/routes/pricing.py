"""
Pricing Routes

API endpoints for crew pricing information and breakdowns.
"""
from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, optional_auth, UserCtx
from app.models.crew import Crew
from app.schemas.pricing import PriceBreakdown, PricingConfig
from app.services.pricing_service import (
    get_price_breakdown,
    BASE_RENTAL_PRICE,
    BASE_BUYOUT_MULTIPLIER,
    RARITY_MULTIPLIERS,
)

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.get("/crews/{crew_id}", response_model=PriceBreakdown)
def get_crew_pricing(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth)
) -> PriceBreakdown:
    """
    Get detailed pricing breakdown for a crew.
    
    Shows:
    - Rental price per mission
    - Buyout price
    - All pricing factors (rarity, level, success rate, rating, demand)
    - Multipliers applied
    - Calculation formulas
    
    Public endpoint - anyone can view pricing.
    Cached for 5 minutes.
    """
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    # Check if crew is public or user has access
    if not crew.is_public and (user is None or crew.org_id != user.org_id):
        raise HTTPException(status_code=404, detail="Crew not found")
    
    breakdown = get_price_breakdown(db, crew, use_cache=True)
    return PriceBreakdown(**breakdown)


@router.get("/config", response_model=PricingConfig)
def get_pricing_config(
    user: UserCtx | None = Depends(optional_auth)
) -> PricingConfig:
    """
    Get global pricing configuration.
    
    Shows the base prices and multipliers used for all crews.
    Useful for understanding the pricing model.
    
    Public endpoint.
    """
    return PricingConfig(
        base_rental_price=BASE_RENTAL_PRICE,
        base_buyout_multiplier=BASE_BUYOUT_MULTIPLIER,
        rarity_multipliers={
            "common": RARITY_MULTIPLIERS["common"],
            "advanced": RARITY_MULTIPLIERS["advanced"],
            "elite": RARITY_MULTIPLIERS["elite"],
            "prime": RARITY_MULTIPLIERS["prime"],
        },
        level_tiers={
            "1-2": 1.0,
            "3-4": 1.2,
            "5-6": 1.4,
            "7-8": 1.7,
            "9-10": 2.0,
        },
        success_rate_tiers={
            "0-49%": 0.8,
            "50-69%": 1.0,
            "70-79%": 1.1,
            "80-89%": 1.3,
            "90-94%": 1.5,
            "95-100%": 1.8,
        },
        rating_tiers={
            "0-1.9": 0.8,
            "2.0-2.9": 0.9,
            "3.0-3.4": 1.0,
            "3.5-3.9": 1.1,
            "4.0-4.4": 1.2,
            "4.5-5.0": 1.4,
        }
    )
