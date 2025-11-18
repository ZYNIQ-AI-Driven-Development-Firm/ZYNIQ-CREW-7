"""
Agent Model

Individual AI agents that form crews.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infra.db import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crew_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("crews.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Agent identity
    role: Mapped[str] = mapped_column(String, nullable=False)  # orchestrator, researcher, writer, etc.
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Agent specialization
    specialist_type: Mapped[str | None] = mapped_column(String, nullable=True)  # specific expertise
    backstory: Mapped[str | None] = mapped_column(Text, nullable=True)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Configuration
    llm_config: Mapped[dict | None] = mapped_column(Text, nullable=True)  # JSON as text for now
    tools_list: Mapped[str | None] = mapped_column(Text, nullable=True)  # Comma-separated tool names
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    crew = relationship("Crew", back_populates="agents")
    
    def __repr__(self):
        return f"<Agent(id={self.id}, name={self.name}, role={self.role}, crew_id={self.crew_id})>"
