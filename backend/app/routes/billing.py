from __future__ import annotations

import json

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import UserCtx, auth, get_db
from app.models.billing import ensure_wallet
from app.services.audit import audit

router = APIRouter(prefix="/billing", tags=["billing"])
stripe.api_key = settings.STRIPE_SECRET


def _require_admin(user: UserCtx) -> None:
    if user.role not in {"owner", "admin"}:
        raise HTTPException(403, "forbidden")


class CheckoutIn(BaseModel):
    pack: str = "credits"


@router.post("/checkout")
def checkout(
    body: CheckoutIn,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> dict:
    _require_admin(user)
    if not settings.STRIPE_PRICE_CREDITS:
        raise HTTPException(500, "stripe_not_configured")
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{"price": settings.STRIPE_PRICE_CREDITS, "quantity": 1}],
        success_url="https://your.app/billing/success",
        cancel_url="https://your.app/billing/cancel",
        metadata={"org_id": user.org_id, "pack": body.pack},
    )
    audit(db, user, "billing.checkout", {"pack": body.pack, "session": session.id})
    return {"id": session.id, "url": session.url}


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.body()
    event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        org_id = session["metadata"].get("org_id")
        if org_id:
            wallet = ensure_wallet(db, org_id)
            wallet.credits += 1000
            db.commit()
    return {"ok": True}


@router.get("/wallet")
def wallet(user: UserCtx = Depends(auth), db: Session = Depends(get_db)) -> dict:
    _require_admin(user)
    wallet_obj = ensure_wallet(db, user.org_id)
    audit(db, user, "billing.wallet_view", {})
    return {"org_id": wallet_obj.org_id, "credits": wallet_obj.credits}
