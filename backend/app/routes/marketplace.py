from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db
from app.models.crew import Crew
from app.schemas.crew import CrewOut
from app.services.crew_service import fork_crew

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


def _to_out(crew: Crew) -> CrewOut:
    return CrewOut(
        id=crew.id,
        name=crew.name,
        role=crew.role,
        recipe_json=crew.recipe_json or {},
        base_crew_id=crew.base_crew_id,
        is_public=crew.is_public,
        kv_namespace=crew.kv_namespace,
        vector_collection=crew.vector_collection,
        models_json=crew.models_json or {},
        tools_json=crew.tools_json or {},
        env_json=crew.env_json or {},
    )


@router.get("", response_model=list[CrewOut])
def list_public(db: Session = Depends(get_db)) -> list[CrewOut]:
    items = db.query(Crew).filter(Crew.is_public.is_(True)).order_by(Crew.name).all()
    return [_to_out(crew) for crew in items]


@router.get("/{crew_id}", response_model=CrewOut)
def get_public(crew_id: UUID, db: Session = Depends(get_db)) -> CrewOut:
    crew = db.get(Crew, crew_id)
    if not crew or not crew.is_public:
        raise HTTPException(404, "Template not found")
    return _to_out(crew)


@router.post("/{crew_id}/fork", response_model=CrewOut)
def fork_public(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> CrewOut:
    crew = db.get(Crew, crew_id)
    if not crew or not crew.is_public:
        raise HTTPException(404, "Template not found")
    copy = fork_crew(
        db,
        crew_id,
        new_name=f"{crew.name} clone",
        owner_id=user.user_id,
        org_id=user.org_id,
    )
    return _to_out(copy)
