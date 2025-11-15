from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infra.db import Base


class Crew(Base):
    __tablename__ = "crews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, default="demo")
    org_id: Mapped[str] = mapped_column(String, nullable=False, default="default")
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="orchestrated_team")
    recipe_json: Mapped[dict | None] = mapped_column(JSON, default=dict)
    base_crew_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("crews.id"), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    kv_namespace: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=lambda: f"kv:{uuid.uuid4()}",
    )
    vector_collection: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=lambda: f"vec_{uuid.uuid4().hex[:8]}",
    )
    models_json: Mapped[dict | None] = mapped_column(JSON, default=dict)
    tools_json: Mapped[dict | None] = mapped_column(JSON, default=dict)
    env_json: Mapped[dict | None] = mapped_column(JSON, default=dict)
    api_key: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Crypto relationships
    rentals = relationship("CrewRental", back_populates="crew")
    portfolio = relationship("CrewPortfolio", back_populates="crew", uselist=False)
    xp = relationship("CrewXP", back_populates="crew", uselist=False)
    ratings = relationship("CrewRating", back_populates="crew")
