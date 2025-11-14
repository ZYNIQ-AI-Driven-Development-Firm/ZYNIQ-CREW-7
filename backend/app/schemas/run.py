from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class RunCreate(BaseModel):
    prompt: str
    inputs: Optional[dict] = None


class RunOut(BaseModel):
    id: UUID
    crew_id: UUID
    status: str
    prompt: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
