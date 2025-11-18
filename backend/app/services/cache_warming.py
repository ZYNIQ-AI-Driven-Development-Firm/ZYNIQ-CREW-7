"""
Cache warming utilities for pre-populating frequently accessed data.

Runs on application startup to reduce cold-start latency.
"""
from __future__ import annotations

from sqlalchemy.orm import Session
from app.models.crew import Crew
from app.services.metadata_service import crew_to_nft_metadata
from app.services.cache_service import get_cache_service


def warm_popular_crew_metadata(db: Session, limit: int = 10) -> int:
    """
    Pre-cache metadata for the most popular crews.
    
    Selects public crews and caches their NFT metadata to Redis.
    This reduces response time for first-time viewers.
    
    Args:
        db: Database session
        limit: Number of popular crews to cache (default: 10)
    
    Returns:
        Number of crews successfully cached
    """
    cache = get_cache_service()
    cached_count = 0
    
    # Get top public crews (ordered by creation date for now)
    # TODO: Order by actual popularity metrics (views, forks, ratings)
    popular_crews = db.query(Crew).filter(
        Crew.is_public == True  # noqa: E712
    ).order_by(
        Crew.id.desc()  # Use id since created_at doesn't exist
    ).limit(limit).all()
    
    for crew in popular_crews:
        try:
            # Generate metadata (this will auto-cache it)
            crew_to_nft_metadata(db, crew, use_cache=True)
            cached_count += 1
        except Exception as e:
            print(f"Failed to cache metadata for crew {crew.id}: {e}")
            continue
    
    return cached_count


def warm_all_caches(db: Session) -> dict[str, int]:
    """
    Warm all application caches on startup.
    
    Returns:
        Dictionary with cache warming results
    """
    results = {}
    
    # Warm popular crew metadata
    crew_count = warm_popular_crew_metadata(db, limit=10)
    results["popular_crews"] = crew_count
    
    # Future: Add more cache warming strategies
    # - Top agents
    # - Leaderboards
    # - Popular searches
    
    return results
