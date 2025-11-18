"""
Rating Service

Business logic for crew ratings and reputation management.
"""
from __future__ import annotations

from uuid import UUID
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.crypto import CrewRating
from app.models.crew import Crew
from app.schemas.rating import RatingCreate, RatingUpdate, RatingStats
from app.services.cache_service import get_cache_service


def add_rating(
    db: Session,
    user_id: UUID,
    rating_data: RatingCreate
) -> CrewRating:
    """
    Add or update a rating for a crew.
    
    If user has already rated this crew, updates their existing rating.
    Otherwise, creates a new rating.
    
    Args:
        db: Database session
        user_id: ID of user creating the rating
        rating_data: Rating details (crew_id, rating, comment, run_id)
    
    Returns:
        CrewRating instance
    
    Raises:
        HTTPException: If crew doesn't exist or validation fails
    """
    # Verify crew exists
    crew = db.get(Crew, rating_data.crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    
    # Check if user already rated this crew
    existing_rating = db.query(CrewRating).filter(
        CrewRating.crew_id == rating_data.crew_id,
        CrewRating.user_id == user_id
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        if rating_data.comment is not None:
            existing_rating.comment = rating_data.comment
        if rating_data.run_id is not None:
            existing_rating.run_id = rating_data.run_id
        db.commit()
        db.refresh(existing_rating)
        
        # Invalidate caches
        _invalidate_rating_caches(rating_data.crew_id)
        
        return existing_rating
    
    # Create new rating
    new_rating = CrewRating(
        crew_id=rating_data.crew_id,
        user_id=user_id,
        rating=rating_data.rating,
        comment=rating_data.comment,
        run_id=rating_data.run_id
    )
    
    try:
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        
        # Invalidate caches
        _invalidate_rating_caches(rating_data.crew_id)
        
        return new_rating
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create rating") from e


def update_rating(
    db: Session,
    rating_id: int,
    user_id: UUID,
    update_data: RatingUpdate
) -> CrewRating:
    """
    Update an existing rating.
    
    Args:
        db: Database session
        rating_id: ID of rating to update
        user_id: ID of user (must be owner of rating)
        update_data: Fields to update
    
    Returns:
        Updated CrewRating
    
    Raises:
        HTTPException: If rating not found or user not authorized
    """
    rating = db.get(CrewRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    if rating.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this rating")
    
    # Update fields
    if update_data.rating is not None:
        rating.rating = update_data.rating
    if update_data.comment is not None:
        rating.comment = update_data.comment
    
    db.commit()
    db.refresh(rating)
    
    # Invalidate caches
    _invalidate_rating_caches(rating.crew_id)
    
    return rating


def delete_rating(
    db: Session,
    rating_id: int,
    user_id: UUID
) -> bool:
    """
    Delete a rating.
    
    Args:
        db: Database session
        rating_id: ID of rating to delete
        user_id: ID of user (must be owner of rating)
    
    Returns:
        True if deleted successfully
    
    Raises:
        HTTPException: If rating not found or user not authorized
    """
    rating = db.get(CrewRating, rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    if rating.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this rating")
    
    crew_id = rating.crew_id
    db.delete(rating)
    db.commit()
    
    # Invalidate caches
    _invalidate_rating_caches(crew_id)
    
    return True


def get_crew_ratings(
    db: Session,
    crew_id: UUID,
    skip: int = 0,
    limit: int = 50
) -> list[CrewRating]:
    """
    Get all ratings for a crew (paginated).
    
    Args:
        db: Database session
        crew_id: ID of crew
        skip: Number of ratings to skip
        limit: Maximum ratings to return
    
    Returns:
        List of CrewRating instances
    """
    return db.query(CrewRating).filter(
        CrewRating.crew_id == crew_id
    ).order_by(
        CrewRating.created_at.desc()
    ).offset(skip).limit(limit).all()


def get_user_rating(
    db: Session,
    crew_id: UUID,
    user_id: UUID
) -> Optional[CrewRating]:
    """
    Get a specific user's rating for a crew.
    
    Args:
        db: Database session
        crew_id: ID of crew
        user_id: ID of user
    
    Returns:
        CrewRating if found, None otherwise
    """
    return db.query(CrewRating).filter(
        CrewRating.crew_id == crew_id,
        CrewRating.user_id == user_id
    ).first()


def calculate_rating_stats(
    db: Session,
    crew_id: UUID,
    use_cache: bool = True
) -> RatingStats:
    """
    Calculate aggregated rating statistics for a crew.
    
    Args:
        db: Database session
        crew_id: ID of crew
        use_cache: Whether to use cache (default: True)
    
    Returns:
        RatingStats with averages and distribution
    """
    # Check cache first
    if use_cache:
        cache = get_cache_service()
        cache_key = f"stats:crew:{crew_id}:ratings"
        cached = cache.get(cache_key)
        if cached:
            return RatingStats(**cached)
    
    # Calculate from database
    ratings = db.query(CrewRating.rating).filter(
        CrewRating.crew_id == crew_id
    ).all()
    
    if not ratings:
        # No ratings yet
        empty_stats = RatingStats(
            crew_id=crew_id,
            total_ratings=0,
            average_rating=0.0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        )
        return empty_stats
    
    # Calculate statistics
    rating_values = [r.rating for r in ratings]
    total_ratings = len(rating_values)
    average_rating = sum(rating_values) / total_ratings
    
    # Distribution
    distribution = {i: rating_values.count(i) for i in range(1, 6)}
    
    stats = RatingStats(
        crew_id=crew_id,
        total_ratings=total_ratings,
        average_rating=round(average_rating, 2),
        rating_distribution=distribution,
        five_star_count=distribution[5],
        four_star_count=distribution[4],
        three_star_count=distribution[3],
        two_star_count=distribution[2],
        one_star_count=distribution[1]
    )
    
    # Cache the result (3 minutes TTL)
    if use_cache:
        cache = get_cache_service()
        cache_key = f"stats:crew:{crew_id}:ratings"
        cache.set(cache_key, stats.model_dump(), ttl=180)
    
    return stats


def get_average_rating(
    db: Session,
    crew_id: UUID,
    use_cache: bool = True
) -> float:
    """
    Get just the average rating for a crew (lightweight).
    
    Args:
        db: Database session
        crew_id: ID of crew
        use_cache: Whether to use cache
    
    Returns:
        Average rating (0.0 if no ratings)
    """
    stats = calculate_rating_stats(db, crew_id, use_cache=use_cache)
    return stats.average_rating


def _invalidate_rating_caches(crew_id: UUID):
    """
    Invalidate all rating-related caches for a crew.
    
    Called after rating create/update/delete operations.
    """
    cache = get_cache_service()
    
    # Invalidate rating stats cache
    cache.delete(f"stats:crew:{crew_id}:ratings")
    
    # Invalidate crew metadata cache (includes rating)
    cache.invalidate_all_crew_metadata(crew_id)
