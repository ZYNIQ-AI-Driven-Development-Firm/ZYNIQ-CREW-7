"""
Rating Schemas

Pydantic models for crew rating requests and responses.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional


class RatingCreate(BaseModel):
    """Request to create a new rating."""
    crew_id: UUID = Field(..., description="ID of the crew being rated")
    rating: int = Field(..., ge=1, le=5, description="Rating value (1-5)")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional review comment")
    run_id: Optional[UUID] = Field(None, description="Optional run/mission ID this rating is for")


class RatingUpdate(BaseModel):
    """Request to update an existing rating."""
    rating: Optional[int] = Field(None, ge=1, le=5, description="Updated rating value (1-5)")
    comment: Optional[str] = Field(None, max_length=1000, description="Updated review comment")


class RatingOut(BaseModel):
    """Rating response."""
    id: int
    crew_id: UUID
    user_id: UUID
    rating: int
    comment: Optional[str] = None
    run_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RatingStats(BaseModel):
    """Aggregated rating statistics for a crew."""
    crew_id: UUID
    total_ratings: int = Field(..., description="Total number of ratings")
    average_rating: float = Field(..., description="Average rating (1.0-5.0)")
    rating_distribution: dict[int, int] = Field(
        ..., 
        description="Distribution of ratings {1: count, 2: count, ...}"
    )
    
    # Breakdown by star count
    five_star_count: int = 0
    four_star_count: int = 0
    three_star_count: int = 0
    two_star_count: int = 0
    one_star_count: int = 0


class CrewWithRating(BaseModel):
    """Crew info with rating statistics (for marketplace listings)."""
    crew_id: UUID
    average_rating: float
    total_ratings: int
