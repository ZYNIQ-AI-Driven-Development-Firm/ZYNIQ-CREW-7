from __future__ import annotations

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infra.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    org_id: Mapped[str] = mapped_column(String, nullable=False, default="default")
    role: Mapped[str] = mapped_column(String, nullable=False, default="owner")
    
    # Crypto relationships
    wallet = relationship("UserWallet", back_populates="user", uselist=False)
    token_balances = relationship("TokenBalance", back_populates="user")
    token_transactions = relationship("TokenTransaction", back_populates="user")
    rented_crews = relationship("CrewRental", foreign_keys="CrewRental.renter_user_id", back_populates="renter")
