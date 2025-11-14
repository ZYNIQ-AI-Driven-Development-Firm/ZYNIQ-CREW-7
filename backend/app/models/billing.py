from __future__ import annotations

import uuid

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.infra.db import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    credits: Mapped[int] = mapped_column(Integer, default=0)


def ensure_wallet(db: Session, org_id: str) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.org_id == org_id).first()
    if wallet is None:
        wallet = Wallet(org_id=org_id, credits=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet
