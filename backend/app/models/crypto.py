"""
Database models for crypto/wallet features.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base


class ChainType(str, enum.Enum):
    """Supported blockchain networks."""
    ETHEREUM = "ethereum"
    POLYGON = "polygon"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"
    LOCAL = "local"
    TEST = "test"


class UserWallet(Base):
    """User wallet addresses."""
    __tablename__ = "user_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    address = Column(String(42), nullable=False, index=True)  # Ethereum address
    chain = Column(SQLEnum(ChainType), nullable=False, default=ChainType.TEST)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="wallet")
    
    __table_args__ = (
        Index("idx_user_wallet_address", address),
    )


class TokenBalance(Base):
    """Off-chain token balance ledger."""
    __tablename__ = "token_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_symbol = Column(String(10), nullable=False, default="C7T")
    balance = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="token_balances")
    
    __table_args__ = (
        Index("idx_token_balance_user_symbol", user_id, token_symbol, unique=True),
    )


class TransactionDirection(str, enum.Enum):
    """Direction of token transaction."""
    CREDIT = "credit"
    DEBIT = "debit"


class TokenTransaction(Base):
    """Token transaction history."""
    __tablename__ = "token_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_symbol = Column(String(10), nullable=False, default="C7T")
    amount = Column(Float, nullable=False)
    direction = Column(SQLEnum(TransactionDirection), nullable=False)
    reason = Column(String(255), nullable=False)
    balance_after = Column(Float, nullable=False)
    reference_id = Column(String(100), nullable=True)  # Related entity ID (crew_id, rental_id, etc.)
    reference_type = Column(String(50), nullable=True)  # Type of reference (rental, purchase, etc.)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="token_transactions")
    
    __table_args__ = (
        Index("idx_token_tx_user_created", user_id, created_at),
        Index("idx_token_tx_reference", reference_type, reference_id),
    )


class CrewRental(Base):
    """Crew rental agreements."""
    __tablename__ = "crew_rentals"
    
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False)
    renter_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    price_c7t = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_hours = Column(Integer, nullable=True)  # NULL = unlimited until canceled
    tx_reference = Column(String(100), nullable=True)  # Transaction ID
    status = Column(String(20), nullable=False, default="active")  # active, completed, canceled
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crew = relationship("Crew", back_populates="rentals")
    renter = relationship("User", foreign_keys=[renter_user_id], back_populates="rented_crews")
    owner = relationship("User", foreign_keys=[owner_user_id])
    
    __table_args__ = (
        Index("idx_rental_crew_status", crew_id, status),
        Index("idx_rental_renter", renter_user_id),
    )


class CrewPortfolio(Base):
    """Crew portfolio and reputation metrics."""
    __tablename__ = "crew_portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False, unique=True)
    missions_completed = Column(Integer, nullable=False, default=0)
    hours_worked = Column(Float, nullable=False, default=0.0)
    rating_avg = Column(Float, nullable=True)  # 1-5 stars
    rating_count = Column(Integer, nullable=False, default=0)
    industries = Column(String(500), nullable=True)  # JSON array of industries served
    total_earned_c7t = Column(Float, nullable=False, default=0.0)
    total_rented_count = Column(Integer, nullable=False, default=0)
    last_mission_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crew = relationship("Crew", back_populates="portfolio")
    
    __table_args__ = (
        Index("idx_portfolio_rating", rating_avg),
    )


class CrewXP(Base):
    """Crew experience and leveling system."""
    __tablename__ = "crew_xp"
    
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False, unique=True)
    xp = Column(Integer, nullable=False, default=0)
    level = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crew = relationship("Crew", back_populates="xp")
    
    __table_args__ = (
        Index("idx_crew_xp_level", level),
    )


class CrewRating(Base):
    """Individual crew ratings from users."""
    __tablename__ = "crew_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(String(1000), nullable=True)
    run_id = Column(Integer, ForeignKey("runs.id"), nullable=True)  # Associated mission
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crew = relationship("Crew", back_populates="ratings")
    user = relationship("User")
    run = relationship("Run")
    
    __table_args__ = (
        Index("idx_rating_crew_user", crew_id, user_id),
    )
