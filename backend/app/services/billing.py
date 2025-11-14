from __future__ import annotations

from sqlalchemy.orm import Session

from fastapi import HTTPException

from app.config import settings
from app.models.billing import ensure_wallet


def bill_run(db: Session, org_id: str, credits_needed: int | None = None) -> None:
    required = credits_needed if credits_needed is not None else settings.CREDITS_PER_RUN
    if required <= 0:
        return
    wallet = ensure_wallet(db, org_id)
    if wallet.credits < required:
        raise HTTPException(402, "insufficient_credits")
    wallet.credits -= required
    db.commit()
