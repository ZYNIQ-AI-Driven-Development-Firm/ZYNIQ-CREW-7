from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class CrewCreate(BaseModel):
    name: str
    role: str = "orchestrated_team"
    recipe_json: dict = Field(default_factory=dict)
    is_public: bool = False
    models_json: dict = Field(default_factory=dict)
    tools_json: dict = Field(default_factory=dict)
    env_json: dict = Field(default_factory=dict)


class CrewPatch(BaseModel):
    name: str | None = None
    role: str | None = None
    recipe_json: dict | None = None
    is_public: bool | None = None
    models_json: dict | None = None
    tools_json: dict | None = None
    env_json: dict | None = None

class CrewOut(BaseModel):
    id: UUID
    name: str
    role: str
    recipe_json: dict
    base_crew_id: Optional[UUID] = None
    is_public: bool
    kv_namespace: str
    vector_collection: str
    models_json: dict
    tools_json: dict
    env_json: dict
    base_price_c7t: float = 0
    rental_price_c7t: float = 0
    for_sale: bool = False
    for_rent: bool = False
