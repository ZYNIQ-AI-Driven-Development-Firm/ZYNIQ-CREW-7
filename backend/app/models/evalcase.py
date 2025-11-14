from __future__ import annotations

import uuid

from sqlalchemy import JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infra.db import Base


class EvalCase(Base):
    __tablename__ = "evalcases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crew_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    input_json: Mapped[dict] = mapped_column(JSON)
    expected_json: Mapped[dict] = mapped_column(JSON)
