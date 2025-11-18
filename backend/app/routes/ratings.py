"""
Rating Routes

API endpoints for crew ratings and reviews.
"""
from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db, optional_auth
from app.schemas.rating import (
    RatingCreate,
    RatingUpdate,
    RatingOut,
    RatingStats
)
from app.services.rating_service import (
    add_rating,
    update_rating,
    delete_rating,
    get_crew_ratings,
    get_user_rating,
    calculate_rating_stats
)
from app.services.limits import enforce_rate

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("", response_model=RatingOut, status_code=201)
def create_rating(
    payload: RatingCreate,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
) -> RatingOut:
    """
    Create or update a rating for a crew.
    
    - If user has already rated this crew, updates their rating
    - Otherwise, creates a new rating
    - Rating must be between 1-5
    - Comment is optional (max 1000 chars)
    """
    enforce_rate(user.user_id, "ratings.create", rpm=10, cap=50)
    
    user_uuid = UUID(user.user_id)
    rating = add_rating(db, user_uuid, payload)
    return RatingOut.model_validate(rating)


@router.patch("/{rating_id}", response_model=RatingOut)
def update_rating_endpoint(
    rating_id: int,
    payload: RatingUpdate,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
) -> RatingOut:
    """
    Update an existing rating.
    
    - Only the user who created the rating can update it
    - Can update rating value and/or comment
    """
    user_uuid = UUID(user.user_id)
    rating = update_rating(db, rating_id, user_uuid, payload)
    return RatingOut.model_validate(rating)


@router.delete("/{rating_id}", status_code=204)
def delete_rating_endpoint(
    rating_id: int,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
):
    """
    Delete a rating.
    
    - Only the user who created the rating can delete it
    """
    user_uuid = UUID(user.user_id)
    delete_rating(db, rating_id, user_uuid)
    return None


@router.get("/crews/{crew_id}", response_model=list[RatingOut])
def list_crew_ratings(
    crew_id: UUID,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth)
) -> list[RatingOut]:
    """
    Get all ratings for a crew (paginated).
    
    - Returns ratings sorted by most recent first
    - Public endpoint (no auth required)
    - Max 50 ratings per request
    """
    if limit > 50:
        limit = 50
    
    ratings = get_crew_ratings(db, crew_id, skip=skip, limit=limit)
    return [RatingOut.model_validate(r) for r in ratings]


@router.get("/crews/{crew_id}/stats", response_model=RatingStats)
def get_crew_rating_stats(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth)
) -> RatingStats:
    """
    Get aggregated rating statistics for a crew.
    
    Returns:
    - Average rating
    - Total number of ratings
    - Distribution by star count (1-5)
    - Individual star counts
    
    Public endpoint, cached for 3 minutes.
    """
    return calculate_rating_stats(db, crew_id, use_cache=True)


@router.get("/crews/{crew_id}/my-rating", response_model=RatingOut | None)
def get_my_rating(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db)
) -> RatingOut | None:
    """
    Get the current user's rating for a crew.
    
    Returns:
    - RatingOut if user has rated this crew
    - None if user hasn't rated yet
    """
    user_uuid = UUID(user.user_id)
    rating = get_user_rating(db, crew_id, user_uuid)
    if not rating:
        return None
    return RatingOut.model_validate(rating)
