from __future__ import annotations

from uuid import UUID
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db
from app.models.crew import Crew
from app.models.crypto import CrewRental
from app.schemas.crew import CrewOut
from app.services.crew_service import fork_crew
from app.services.token_service import TokenService, InsufficientBalanceError
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


def _to_out(crew: Crew) -> CrewOut:
    return CrewOut(
        id=crew.id,
        name=crew.name,
        role=crew.role,
        recipe_json=crew.recipe_json or {},
        base_crew_id=crew.base_crew_id,
        is_public=crew.is_public,
        kv_namespace=crew.kv_namespace,
        vector_collection=crew.vector_collection,
        models_json=crew.models_json or {},
        tools_json=crew.tools_json or {},
        env_json=crew.env_json or {},
        base_price_c7t=getattr(crew, 'base_price_c7t', 0),
        rental_price_c7t=getattr(crew, 'rental_price_c7t', 0),
        for_sale=getattr(crew, 'for_sale', False),
        for_rent=getattr(crew, 'for_rent', False),
    )


@router.get("", response_model=list[CrewOut])
def list_public(db: Session = Depends(get_db)) -> list[CrewOut]:
    items = db.query(Crew).filter(Crew.is_public.is_(True)).order_by(Crew.name).all()
    return [_to_out(crew) for crew in items]


@router.get("/{crew_id}", response_model=CrewOut)
def get_public(crew_id: UUID, db: Session = Depends(get_db)) -> CrewOut:
    crew = db.get(Crew, crew_id)
    if not crew or not crew.is_public:
        raise HTTPException(404, "Template not found")
    return _to_out(crew)


@router.post("/{crew_id}/fork", response_model=CrewOut)
def fork_public(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> CrewOut:
    crew = db.get(Crew, crew_id)
    if not crew or not crew.is_public:
        raise HTTPException(404, "Template not found")
    copy = fork_crew(
        db,
        crew_id,
        new_name=f"{crew.name} clone",
        owner_id=user.user_id,
        org_id=user.org_id,
    )
    return _to_out(copy)


# ========== NEW CRYPTO/TOKEN ENDPOINTS ==========

class RentCrewRequest(BaseModel):
    """Request to rent a crew."""
    duration_hours: Optional[int] = Field(None, description="Rental duration in hours (null = until canceled)")


class RentCrewResponse(BaseModel):
    """Response after renting a crew."""
    rental_id: int
    crew_id: UUID
    crew_name: str
    price_c7t: float
    duration_hours: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    remaining_balance: float
    tx_reference: str


@router.post("/{crew_id}/rent", response_model=RentCrewResponse)
def rent_crew(
    crew_id: UUID,
    request: RentCrewRequest,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> RentCrewResponse:
    """
    Rent a crew for a specified duration.
    Debits C7T tokens from the user's balance.
    """
    # Get crew
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    # Check if crew is available for rent
    if not getattr(crew, 'for_rent', False):
        raise HTTPException(400, "Crew is not available for rent")
    
    rental_price = getattr(crew, 'rental_price_c7t', 0)
    if rental_price <= 0:
        raise HTTPException(400, "Crew rental price not set")
    
    # Check if user is trying to rent their own crew
    if crew.owner_id == user.user_id:
        raise HTTPException(400, "Cannot rent your own crew")
    
    # Check if crew is already rented (active rental exists)
    active_rental = db.query(CrewRental).filter(
        CrewRental.crew_id == crew_id,
        CrewRental.status == "active"
    ).first()
    
    if active_rental:
        raise HTTPException(400, "Crew is currently rented by another user")
    
    # Initialize token service
    token_service = TokenService(db)
    
    # Try to debit tokens
    try:
        transaction = token_service.debit(
            user_id=user.user_id,
            amount=rental_price,
            reason=f"Rent crew: {crew.name}",
            reference_id=str(crew_id),
            reference_type="crew_rental",
        )
    except InsufficientBalanceError as e:
        current_balance = token_service.get_balance(user.user_id)
        raise HTTPException(
            400,
            f"Insufficient C7T balance. Have: {current_balance}, Need: {rental_price}"
        )
    
    # Calculate end time if duration specified
    start_time = datetime.utcnow()
    end_time = None
    if request.duration_hours:
        end_time = start_time + timedelta(hours=request.duration_hours)
    
    # Create rental record
    rental = CrewRental(
        crew_id=crew_id,
        renter_user_id=user.user_id,
        owner_user_id=crew.owner_id,
        price_c7t=rental_price,
        start_time=start_time,
        end_time=end_time,
        duration_hours=request.duration_hours,
        tx_reference=str(transaction.id),
        status="active",
    )
    
    db.add(rental)
    
    # Credit the owner
    token_service.credit(
        user_id=crew.owner_id,
        amount=rental_price,
        reason=f"Crew rental income: {crew.name}",
        reference_id=str(crew_id),
        reference_type="crew_rental_income",
    )
    
    db.commit()
    db.refresh(rental)
    
    remaining_balance = token_service.get_balance(user.user_id)
    
    logger.info(f"User {user.user_id} rented crew {crew_id} for {rental_price} C7T")
    
    return RentCrewResponse(
        rental_id=rental.id,
        crew_id=crew_id,
        crew_name=crew.name,
        price_c7t=rental_price,
        duration_hours=request.duration_hours,
        start_time=start_time,
        end_time=end_time,
        remaining_balance=remaining_balance,
        tx_reference=str(transaction.id),
    )


class BuyCrewResponse(BaseModel):
    """Response after buying a crew."""
    crew_id: UUID
    crew_name: str
    price_c7t: float
    remaining_balance: float
    tx_reference: str


@router.post("/{crew_id}/buy", response_model=BuyCrewResponse)
def buy_crew(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> BuyCrewResponse:
    """
    Purchase a crew permanently.
    Transfers ownership and debits C7T tokens.
    """
    # Get crew
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    # Check if crew is for sale
    if not getattr(crew, 'for_sale', False):
        raise HTTPException(400, "Crew is not for sale")
    
    base_price = getattr(crew, 'base_price_c7t', 0)
    if base_price <= 0:
        raise HTTPException(400, "Crew price not set")
    
    # Check if user is trying to buy their own crew
    if crew.owner_id == user.user_id:
        raise HTTPException(400, "You already own this crew")
    
    # Initialize token service
    token_service = TokenService(db)
    previous_owner = crew.owner_id
    
    # Try to debit tokens
    try:
        transaction = token_service.debit(
            user_id=user.user_id,
            amount=base_price,
            reason=f"Buy crew: {crew.name}",
            reference_id=str(crew_id),
            reference_type="crew_purchase",
        )
    except InsufficientBalanceError as e:
        current_balance = token_service.get_balance(user.user_id)
        raise HTTPException(
            400,
            f"Insufficient C7T balance. Have: {current_balance}, Need: {base_price}"
        )
    
    # Transfer ownership
    crew.owner_id = user.user_id
    crew.org_id = user.org_id
    
    # Mark as no longer for sale
    setattr(crew, 'for_sale', False)
    
    # Credit the previous owner
    token_service.credit(
        user_id=previous_owner,
        amount=base_price,
        reason=f"Crew sale: {crew.name}",
        reference_id=str(crew_id),
        reference_type="crew_sale_income",
    )
    
    db.commit()
    
    remaining_balance = token_service.get_balance(user.user_id)
    
    logger.info(f"User {user.user_id} bought crew {crew_id} for {base_price} C7T")
    
    return BuyCrewResponse(
        crew_id=crew_id,
        crew_name=crew.name,
        price_c7t=base_price,
        remaining_balance=remaining_balance,
        tx_reference=str(transaction.id),
    )


@router.post("/{crew_id}/set-pricing")
def set_crew_pricing(
    crew_id: UUID,
    base_price_c7t: Optional[float] = None,
    rental_price_c7t: Optional[float] = None,
    for_sale: bool = False,
    for_rent: bool = False,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
):
    """Set pricing and availability for a crew (owner only)."""
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    
    if crew.owner_id != user.user_id:
        raise HTTPException(403, "Only the owner can set crew pricing")
    
    if base_price_c7t is not None:
        setattr(crew, 'base_price_c7t', base_price_c7t)
    if rental_price_c7t is not None:
        setattr(crew, 'rental_price_c7t', rental_price_c7t)
    
    setattr(crew, 'for_sale', for_sale)
    setattr(crew, 'for_rent', for_rent)
    
    db.commit()
    
    return {
        "message": "Pricing updated",
        "crew_id": crew_id,
        "base_price_c7t": getattr(crew, 'base_price_c7t', 0),
        "rental_price_c7t": getattr(crew, 'rental_price_c7t', 0),
        "for_sale": for_sale,
        "for_rent": for_rent,
    }

