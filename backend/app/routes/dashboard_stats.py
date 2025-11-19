"""
Dashboard Statistics - Extended with crypto and marketplace metrics.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from uuid import UUID
import logging

from app.deps import UserCtx, auth, get_db
from app.models.crew import Crew
from app.models.run import Run
from app.models.crypto import (
    CrewRental,
    TokenBalance,
    TokenTransaction,
    TransactionDirection,
)
from app.services.token_service import TokenService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)


class DashboardStats(BaseModel):
    """Dashboard statistics response."""
    # User-specific stats
    user_crews_count: int
    user_runs_count: int
    user_c7t_balance: float
    user_crews_owned_count: int
    user_active_rentals_count: int
    user_total_earned_c7t: float
    user_total_spent_c7t: float
    
    # Marketplace stats
    total_crews_listed: int
    total_crews_for_sale: int
    total_crews_for_rent: int
    total_crews_rented: int
    total_c7t_volume: float
    
    # Platform stats (optional - for admins)
    platform_total_users: Optional[int] = None
    platform_total_crews: Optional[int] = None
    platform_total_runs: Optional[int] = None


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive dashboard statistics including crypto/marketplace metrics.
    
    Returns user-specific stats and public marketplace stats.
    """
    token_service = TokenService(db)
    
    # User-specific crew count
    user_crews_count = db.query(func.count(Crew.id)).filter(
        Crew.owner_id == user.user_id
    ).scalar() or 0
    
    # User-specific run count (join through Crew since Run doesn't have owner_id)
    user_runs_count = db.query(func.count(Run.id)).join(
        Crew, Run.crew_id == Crew.id
    ).filter(
        Crew.owner_id == user.user_id
    ).scalar() or 0
    
    # User C7T balance
    user_c7t_balance = token_service.get_balance(UUID(user.user_id))
    
    # User owned crews count (same as user_crews_count but explicit)
    user_crews_owned_count = user_crews_count
    
    # User active rentals (where user is renter)
    user_active_rentals_count = db.query(func.count(CrewRental.id)).filter(
        and_(
            CrewRental.renter_user_id == UUID(user.user_id),
            CrewRental.status == "active"
        )
    ).scalar() or 0
    
    # User total earned C7T (credits)
    user_total_earned = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        and_(
            TokenTransaction.user_id == UUID(user.user_id),
            TokenTransaction.direction == TransactionDirection.CREDIT
        )
    ).scalar() or 0.0
    
    # User total spent C7T (debits)
    user_total_spent = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        and_(
            TokenTransaction.user_id == UUID(user.user_id),
            TokenTransaction.direction == TransactionDirection.DEBIT
        )
    ).scalar() or 0.0
    
    # Total crews listed in marketplace (public crews)
    total_crews_listed = db.query(func.count(Crew.id)).filter(
        Crew.is_public == True
    ).scalar() or 0
    
    # Total crews for sale
    total_crews_for_sale = db.query(Crew).filter(
        Crew.is_public == True
    ).count()
    # Note: Would filter by for_sale column once crews table is updated
    # For now, using is_public as proxy
    
    # Total crews for rent
    total_crews_for_rent = total_crews_listed  # Placeholder
    
    # Total crews currently rented
    total_crews_rented = db.query(func.count(CrewRental.id)).filter(
        CrewRental.status == "active"
    ).scalar() or 0
    
    # Total C7T volume (sum of all transactions)
    total_c7t_volume = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        TokenTransaction.reference_type.in_([
            "crew_rental",
            "crew_purchase",
            "crew_rental_income",
            "crew_sale_income"
        ])
    ).scalar() or 0.0
    
    logger.info(f"Dashboard stats requested by user {user.user_id}")
    
    return DashboardStats(
        user_crews_count=user_crews_count,
        user_runs_count=user_runs_count,
        user_c7t_balance=float(user_c7t_balance),
        user_crews_owned_count=user_crews_owned_count,
        user_active_rentals_count=user_active_rentals_count,
        user_total_earned_c7t=float(user_total_earned),
        user_total_spent_c7t=float(user_total_spent),
        total_crews_listed=total_crews_listed,
        total_crews_for_sale=total_crews_for_sale,
        total_crews_for_rent=total_crews_for_rent,
        total_crews_rented=total_crews_rented,
        total_c7t_volume=float(total_c7t_volume),
    )


class TokenStats(BaseModel):
    """Token-specific statistics."""
    balance: float
    total_earned: float
    total_spent: float
    transaction_count: int
    recent_transactions: list[dict]


@router.get("/tokens/stats", response_model=TokenStats)
async def get_token_stats(
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
    limit: int = 10,
):
    """Get detailed token statistics for the current user."""
    token_service = TokenService(db)
    
    balance = token_service.get_balance(UUID(user.user_id))
    
    # Total earned
    total_earned = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        and_(
            TokenTransaction.user_id == UUID(user.user_id),
            TokenTransaction.direction == TransactionDirection.CREDIT
        )
    ).scalar() or 0.0
    
    # Total spent
    total_spent = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        and_(
            TokenTransaction.user_id == UUID(user.user_id),
            TokenTransaction.direction == TransactionDirection.DEBIT
        )
    ).scalar() or 0.0
    
    # Transaction count
    transaction_count = db.query(func.count(TokenTransaction.id)).filter(
        TokenTransaction.user_id == UUID(user.user_id)
    ).scalar() or 0
    
    # Recent transactions
    recent_txs = token_service.get_transaction_history(
        UUID(user.user_id),
        limit=limit
    )
    
    recent_transactions = [
        {
            "id": tx.id,
            "amount": float(tx.amount),
            "direction": tx.direction.value,
            "reason": tx.reason,
            "balance_after": float(tx.balance_after),
            "created_at": tx.created_at.isoformat(),
        }
        for tx in recent_txs
    ]
    
    return TokenStats(
        balance=float(balance),
        total_earned=float(total_earned),
        total_spent=float(total_spent),
        transaction_count=transaction_count,
        recent_transactions=recent_transactions,
    )


class RentalStats(BaseModel):
    """Rental-specific statistics."""
    active_rentals_as_renter: int
    active_rentals_as_owner: int
    total_rentals_completed: int
    total_earned_from_rentals: float
    total_spent_on_rentals: float


@router.get("/rentals/stats", response_model=RentalStats)
async def get_rental_stats(
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
):
    """Get rental statistics for the current user."""
    user_uuid = UUID(user.user_id)
    
    # Active rentals where user is renter
    active_as_renter = db.query(func.count(CrewRental.id)).filter(
        and_(
            CrewRental.renter_user_id == user_uuid,
            CrewRental.status == "active"
        )
    ).scalar() or 0
    
    # Active rentals where user is owner
    active_as_owner = db.query(func.count(CrewRental.id)).filter(
        and_(
            CrewRental.owner_user_id == user_uuid,
            CrewRental.status == "active"
        )
    ).scalar() or 0
    
    # Total completed rentals (as renter or owner)
    total_completed = db.query(func.count(CrewRental.id)).filter(
        and_(
            (CrewRental.renter_user_id == user_uuid) |
            (CrewRental.owner_user_id == user_uuid),
            CrewRental.status == "completed"
        )
    ).scalar() or 0
    
    # Total earned from rentals (as owner)
    total_earned = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        and_(
            TokenTransaction.user_id == user_uuid,
            TokenTransaction.direction == TransactionDirection.CREDIT,
            TokenTransaction.reference_type == "crew_rental_income"
        )
    ).scalar() or 0.0
    
    # Total spent on rentals (as renter)
    total_spent = db.query(
        func.coalesce(func.sum(TokenTransaction.amount), 0)
    ).filter(
        and_(
            TokenTransaction.user_id == user_uuid,
            TokenTransaction.direction == TransactionDirection.DEBIT,
            TokenTransaction.reference_type == "crew_rental"
        )
    ).scalar() or 0.0
    
    return RentalStats(
        active_rentals_as_renter=active_as_renter,
        active_rentals_as_owner=active_as_owner,
        total_rentals_completed=total_completed,
        total_earned_from_rentals=float(total_earned),
        total_spent_on_rentals=float(total_spent),
    )
