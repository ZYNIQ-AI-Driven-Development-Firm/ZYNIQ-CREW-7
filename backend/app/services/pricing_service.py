"""
Pricing Service

Dynamic pricing calculation for crew rentals and buyouts.
Prices are calculated based on crew performance, rarity, and market factors.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.crew import Crew
from app.utils.crew_calculations import calculate_level, calculate_rarity_tier
from app.services.rating_service import get_average_rating
from app.services.cache_service import get_cache_service
from app.models.run import Run
from app.models.web3_metadata import RarityTier


# Base pricing constants (in C7T tokens)
BASE_RENTAL_PRICE = 10.0  # Base price per mission
BASE_BUYOUT_MULTIPLIER = 500.0  # Buyout = rental_price * missions_estimate * multiplier


# Pricing multipliers by rarity tier
RARITY_MULTIPLIERS = {
    RarityTier.COMMON: 1.0,
    RarityTier.ADVANCED: 1.5,
    RarityTier.ELITE: 2.5,
    RarityTier.PRIME: 4.0,
}


# Level multipliers (increases with crew experience)
def get_level_multiplier(level: int) -> float:
    """
    Calculate pricing multiplier based on crew level.
    
    Higher level = more expensive due to proven track record.
    """
    if level >= 9:
        return 2.0
    elif level >= 7:
        return 1.7
    elif level >= 5:
        return 1.4
    elif level >= 3:
        return 1.2
    else:
        return 1.0


# Success rate multipliers
def get_success_rate_multiplier(success_rate: float) -> float:
    """
    Calculate pricing multiplier based on success rate.
    
    Higher success rate = more expensive (more reliable).
    """
    if success_rate >= 95:
        return 1.8
    elif success_rate >= 90:
        return 1.5
    elif success_rate >= 80:
        return 1.3
    elif success_rate >= 70:
        return 1.1
    elif success_rate >= 50:
        return 1.0
    else:
        return 0.8  # Discount for unreliable crews


# Rating multipliers
def get_rating_multiplier(average_rating: float) -> float:
    """
    Calculate pricing multiplier based on client ratings.
    
    Higher ratings = more expensive (better reputation).
    """
    if average_rating >= 4.5:
        return 1.4
    elif average_rating >= 4.0:
        return 1.2
    elif average_rating >= 3.5:
        return 1.1
    elif average_rating >= 3.0:
        return 1.0
    elif average_rating >= 2.0:
        return 0.9
    else:
        return 0.8


# Demand multipliers (placeholder - can be enhanced with real market data)
def get_demand_multiplier(crew_type: str) -> float:
    """
    Calculate pricing multiplier based on crew type demand.
    
    Can be enhanced with real-time marketplace data.
    """
    # Currently flat - could track rental frequency, waitlists, etc.
    return 1.0


def calculate_rental_price(
    db: Session,
    crew: Crew,
    use_cache: bool = True
) -> float:
    """
    Calculate the rental price per mission for a crew.
    
    Formula:
    base_price * rarity_mult * level_mult * success_mult * rating_mult * demand_mult
    
    Args:
        db: Database session
        crew: Crew instance
        use_cache: Whether to use cached values for stats
    
    Returns:
        Price in C7T tokens (float)
    """
    # Calculate performance metrics
    runs = db.query(Run).filter(Run.crew_id == crew.id).all()
    total_missions = len(runs)
    completed_missions = len([r for r in runs if r.status == "completed"])
    
    # Calculate success rate
    success_rate = (completed_missions / total_missions * 100) if total_missions > 0 else 0
    
    # Calculate XP and level
    xp = completed_missions * 100
    level = calculate_level(xp)
    
    # Get rarity tier
    rarity_tier = calculate_rarity_tier(level, success_rate)
    
    # Get average rating
    average_rating = get_average_rating(db, crew.id, use_cache=use_cache)
    
    # Calculate multipliers
    rarity_mult = RARITY_MULTIPLIERS[rarity_tier]
    level_mult = get_level_multiplier(level)
    success_mult = get_success_rate_multiplier(success_rate)
    rating_mult = get_rating_multiplier(average_rating)
    demand_mult = get_demand_multiplier(crew.role if crew.role else "custom")
    
    # Calculate final price
    price = (
        BASE_RENTAL_PRICE
        * rarity_mult
        * level_mult
        * success_mult
        * rating_mult
        * demand_mult
    )
    
    # Round to 2 decimal places
    return round(price, 2)


def calculate_buyout_price(
    db: Session,
    crew: Crew,
    rental_price: Optional[float] = None,
    use_cache: bool = True
) -> float:
    """
    Calculate the buyout price for permanent crew ownership.
    
    Formula:
    rental_price * expected_lifetime_missions * buyout_multiplier
    
    Expected lifetime: ~500 missions over crew lifetime
    
    Args:
        db: Database session
        crew: Crew instance
        rental_price: Pre-calculated rental price (optional, will calculate if not provided)
        use_cache: Whether to use cached values
    
    Returns:
        Buyout price in C7T tokens (float)
    """
    # Get rental price if not provided
    if rental_price is None:
        rental_price = calculate_rental_price(db, crew, use_cache=use_cache)
    
    # Calculate expected lifetime value
    # Average crew performs 500 missions over its lifetime
    expected_missions = 500
    
    # Buyout multiplier represents the discount for buying vs renting
    # At 500 missions * rental_price, owner would pay full lifetime value
    # Multiplier of 0.7 = 30% discount for upfront purchase
    buyout_multiplier = 0.7
    
    buyout_price = rental_price * expected_missions * buyout_multiplier
    
    # Round to 2 decimal places
    return round(buyout_price, 2)


def get_price_breakdown(
    db: Session,
    crew: Crew,
    use_cache: bool = True
) -> dict:
    """
    Get detailed breakdown of pricing factors for transparency.
    
    Useful for displaying to users why a crew costs what it does.
    
    Returns:
        Dictionary with pricing components and multipliers
    """
    # Check cache first
    if use_cache:
        cache = get_cache_service()
        cached = cache.get_crew_pricing(crew.id)
        if cached:
            return cached
    
    # Calculate metrics
    runs = db.query(Run).filter(Run.crew_id == crew.id).all()
    total_missions = len(runs)
    completed_missions = len([r for r in runs if r.status == "completed"])
    success_rate = (completed_missions / total_missions * 100) if total_missions > 0 else 0
    
    xp = completed_missions * 100
    level = calculate_level(xp)
    rarity_tier = calculate_rarity_tier(level, success_rate)
    average_rating = get_average_rating(db, crew.id, use_cache=use_cache)
    
    # Get all multipliers
    rarity_mult = RARITY_MULTIPLIERS[rarity_tier]
    level_mult = get_level_multiplier(level)
    success_mult = get_success_rate_multiplier(success_rate)
    rating_mult = get_rating_multiplier(average_rating)
    demand_mult = get_demand_multiplier(crew.role if crew.role else "custom")
    
    # Calculate prices
    rental_price = calculate_rental_price(db, crew, use_cache=use_cache)
    buyout_price = calculate_buyout_price(db, crew, rental_price=rental_price, use_cache=use_cache)
    
    result = {
        "crew_id": str(crew.id),
        "crew_name": crew.name,
        "rental_price_per_mission": rental_price,
        "buyout_price": buyout_price,
        "currency": "C7T",
        "factors": {
            "base_price": BASE_RENTAL_PRICE,
            "rarity": {
                "tier": rarity_tier.value,
                "multiplier": rarity_mult
            },
            "level": {
                "value": level,
                "multiplier": level_mult
            },
            "success_rate": {
                "value": round(success_rate, 1),
                "multiplier": success_mult
            },
            "rating": {
                "value": round(average_rating, 2),
                "multiplier": rating_mult
            },
            "demand": {
                "crew_type": crew.role if crew.role else "custom",
                "multiplier": demand_mult
            }
        },
        "calculations": {
            "rental_formula": "base * rarity * level * success * rating * demand",
            "buyout_formula": "rental * 500 missions * 0.7 discount",
            "total_multiplier": round(
                rarity_mult * level_mult * success_mult * rating_mult * demand_mult, 2
            )
        }
    }
    
    # Cache the result
    if use_cache:
        cache = get_cache_service()
        cache.set_crew_pricing(crew.id, result)
    
    return result
