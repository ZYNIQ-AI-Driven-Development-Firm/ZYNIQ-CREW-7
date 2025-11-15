"""
Crew Portfolio routes - Reputation, XP, and ratings.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import json
import logging

from app.deps import UserCtx, auth, get_db
from app.models.crew import Crew
from app.models.crypto import CrewPortfolio, CrewXP, CrewRating

router = APIRouter(prefix="/crews", tags=["crew-portfolio"])
logger = logging.getLogger(__name__)


class PortfolioResponse(BaseModel):
    """Crew portfolio response."""
    crew_id: UUID
    crew_name: str
    missions_completed: int
    hours_worked: float
    rating_avg: Optional[float]
    rating_count: int
    industries: List[str]
    total_earned_c7t: float
    total_rented_count: int
    last_mission_at: Optional[datetime]
    xp: int
    level: int
    
    class Config:
        from_attributes = True


def calculate_level(xp: int) -> int:
    """Calculate level from XP (100 XP per level)."""
    return max(1, xp // 100 + 1)


@router.get("/{crew_id}/portfolio", response_model=PortfolioResponse)
async def get_crew_portfolio(
    crew_id: UUID,
    db: Session = Depends(get_db),
):
    """Get crew portfolio, reputation, and XP."""
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    # Get or create portfolio
    portfolio = db.query(CrewPortfolio).filter(
        CrewPortfolio.crew_id == crew_id
    ).first()
    
    if not portfolio:
        portfolio = CrewPortfolio(crew_id=crew_id)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    
    # Get or create XP
    xp_record = db.query(CrewXP).filter(
        CrewXP.crew_id == crew_id
    ).first()
    
    if not xp_record:
        xp_record = CrewXP(crew_id=crew_id)
        db.add(xp_record)
        db.commit()
        db.refresh(xp_record)
    
    # Parse industries from JSON string
    industries = []
    if portfolio.industries:
        try:
            industries = json.loads(portfolio.industries)
        except:
            industries = []
    
    return PortfolioResponse(
        crew_id=crew_id,
        crew_name=crew.name,
        missions_completed=portfolio.missions_completed,
        hours_worked=portfolio.hours_worked,
        rating_avg=portfolio.rating_avg,
        rating_count=portfolio.rating_count,
        industries=industries,
        total_earned_c7t=portfolio.total_earned_c7t,
        total_rented_count=portfolio.total_rented_count,
        last_mission_at=portfolio.last_mission_at,
        xp=xp_record.xp,
        level=xp_record.level,
    )


class RateCrewRequest(BaseModel):
    """Request to rate a crew."""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional comment")
    run_id: Optional[UUID] = Field(None, description="Associated mission/run ID")


class RateCrewResponse(BaseModel):
    """Response after rating a crew."""
    rating_id: int
    crew_id: UUID
    new_rating_avg: Optional[float]
    total_ratings: int


@router.post("/{crew_id}/rate", response_model=RateCrewResponse)
async def rate_crew(
    crew_id: UUID,
    request: RateCrewRequest,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
):
    """
    Rate a crew after using it.
    Users can update their rating if they rate again.
    """
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    # Check if user already rated this crew
    existing_rating = db.query(CrewRating).filter(
        CrewRating.crew_id == crew_id,
        CrewRating.user_id == user.user_id,
    ).first()
    
    if existing_rating:
        # Update existing rating
        old_rating = existing_rating.rating
        existing_rating.rating = request.rating
        existing_rating.comment = request.comment
        existing_rating.updated_at = datetime.utcnow()
        rating_record = existing_rating
        is_new = False
    else:
        # Create new rating
        rating_record = CrewRating(
            crew_id=crew_id,
            user_id=user.user_id,
            rating=request.rating,
            comment=request.comment,
            run_id=request.run_id,
        )
        db.add(rating_record)
        is_new = True
        old_rating = None
    
    db.flush()
    
    # Recalculate average rating
    portfolio = db.query(CrewPortfolio).filter(
        CrewPortfolio.crew_id == crew_id
    ).first()
    
    if not portfolio:
        portfolio = CrewPortfolio(crew_id=crew_id)
        db.add(portfolio)
        db.flush()
    
    # Get all ratings for this crew
    all_ratings = db.query(CrewRating).filter(
        CrewRating.crew_id == crew_id
    ).all()
    
    if all_ratings:
        avg_rating = sum(r.rating for r in all_ratings) / len(all_ratings)
        portfolio.rating_avg = round(avg_rating, 2)
        portfolio.rating_count = len(all_ratings)
    
    db.commit()
    db.refresh(rating_record)
    
    logger.info(
        f"User {user.user_id} {'updated' if not is_new else 'added'} rating for crew {crew_id}: {request.rating}/5"
    )
    
    return RateCrewResponse(
        rating_id=rating_record.id,
        crew_id=crew_id,
        new_rating_avg=portfolio.rating_avg,
        total_ratings=portfolio.rating_count,
    )


class CrewRatingOut(BaseModel):
    """Individual rating."""
    id: int
    user_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/{crew_id}/ratings", response_model=List[CrewRatingOut])
async def get_crew_ratings(
    crew_id: UUID,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Get all ratings for a crew."""
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    ratings = (
        db.query(CrewRating)
        .filter(CrewRating.crew_id == crew_id)
        .order_by(CrewRating.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    
    return [
        CrewRatingOut(
            id=r.id,
            user_id=str(r.user_id),
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in ratings
    ]


@router.post("/{crew_id}/add-xp")
async def add_crew_xp(
    crew_id: UUID,
    xp_amount: int = Field(..., ge=1, le=1000),
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
):
    """
    Add XP to a crew (typically called after mission completion).
    Owner only or internal service.
    """
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    # Only owner can add XP manually (or system)
    if crew.owner_id != user.user_id:
        raise HTTPException(403, "Only the crew owner can add XP")
    
    # Get or create XP record
    xp_record = db.query(CrewXP).filter(
        CrewXP.crew_id == crew_id
    ).first()
    
    if not xp_record:
        xp_record = CrewXP(crew_id=crew_id)
        db.add(xp_record)
        db.flush()
    
    # Add XP
    old_xp = xp_record.xp
    old_level = xp_record.level
    xp_record.xp += xp_amount
    xp_record.level = calculate_level(xp_record.xp)
    xp_record.updated_at = datetime.utcnow()
    
    db.commit()
    
    leveled_up = xp_record.level > old_level
    
    logger.info(f"Added {xp_amount} XP to crew {crew_id}, now level {xp_record.level}")
    
    return {
        "crew_id": crew_id,
        "xp_added": xp_amount,
        "total_xp": xp_record.xp,
        "level": xp_record.level,
        "leveled_up": leveled_up,
    }
