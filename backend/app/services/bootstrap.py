from __future__ import annotations

from typing import Iterable

from sqlalchemy.orm import Session

from app.config import settings
from app.models.crew import Crew


SEED_CREWS: list[dict] = [
    {
        "name": "Launch Strategist",
        "role": "orchestrated_team",
        "is_public": True,
        "recipe_json": {
            "mission": "Craft a phased go-to-market plan for early-stage products.",
            "instructions": [
                "Collect the key product context and constraints.",
                "Break down the plan into awareness, acquisition, and retention phases.",
                "Highlight measurable milestones and owner handoffs.",
            ],
        },
        "models_json": {"general": settings.MODEL_GENERAL},
        "tools_json": {},
        "env_json": {"region": "global"},
        "owner_id": "seed",
        "org_id": "public",
    }
]


def ensure_seed_crews(session: Session, seeds: Iterable[dict] | None = None) -> None:
    payloads = list(seeds or SEED_CREWS)
    for payload in payloads:
        exists = (
            session.query(Crew)
            .filter(Crew.name == payload["name"], Crew.is_public.is_(True))
            .first()
        )
        if exists:
            continue
        crew = Crew(
            name=payload["name"],
            role=payload.get("role", "orchestrated_team"),
            recipe_json=payload.get("recipe_json", {}),
            is_public=payload.get("is_public", True),
            models_json=payload.get("models_json", {}),
            tools_json=payload.get("tools_json", {}),
            env_json=payload.get("env_json", {}),
            owner_id=payload.get("owner_id", "seed"),
            org_id=payload.get("org_id", "public"),
        )
        session.add(crew)
    session.commit()
