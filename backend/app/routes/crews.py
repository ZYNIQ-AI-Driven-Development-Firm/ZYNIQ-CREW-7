from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db, optional_auth
from app.models.crew import Crew
from app.models.run import Run
from app.schemas.crew import CrewCreate, CrewOut, CrewPatch
from app.services.crew_service import create_crew, fork_crew, list_crews
from app.services.limits import add_quota, enforce_rate, get_quota

router = APIRouter(prefix="/crews", tags=["crews"])


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


@router.post("", response_model=CrewOut)
def create(payload: CrewCreate, user: UserCtx = Depends(auth), db: Session = Depends(get_db)) -> CrewOut:
    enforce_rate(user.user_id, "crews.create", rpm=10, cap=20)
    add_quota(user.org_id, "crews", delta=1, limit=200)
    crew = create_crew(db, payload, owner_id=user.user_id, org_id=user.org_id)
    return _to_out(crew)


@router.get("", response_model=list[CrewOut])
def list_(user: UserCtx = Depends(auth), db: Session = Depends(get_db)) -> list[CrewOut]:
    return [_to_out(crew) for crew in list_crews(db, user.org_id)]


@router.get("/{crew_id}", response_model=CrewOut)
def get_(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
) -> CrewOut:
    obj = db.get(Crew, crew_id)
    if not obj or (not obj.is_public and (user is None or obj.org_id != user.org_id)):
        raise HTTPException(404, "Crew not found")
    return _to_out(obj)


@router.patch("/{crew_id}", response_model=CrewOut)
def patch(
    crew_id: UUID,
    payload: CrewPatch,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> CrewOut:
    obj = db.get(Crew, crew_id)
    if not obj or obj.org_id != user.org_id:
        raise HTTPException(404, "Crew not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.post("/{crew_id}/fork", response_model=CrewOut)
def fork(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> CrewOut:
    base = db.get(Crew, crew_id)
    if not base or (not base.is_public and base.org_id != user.org_id):
        raise HTTPException(404, "Crew not found")
    enforce_rate(user.user_id, "crews.fork", rpm=20, cap=40)
    add_quota(user.org_id, "crew_forks", delta=1, limit=500)
    clone = fork_crew(
        db,
        crew_id,
        new_name=f"{base.name} (fork)",
        owner_id=user.user_id,
        org_id=user.org_id,
    )
    return _to_out(clone)


@router.get("/{crew_id}/metrics")
def metrics(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> dict[str, float | int]:
    crew = db.get(Crew, crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(404, "Crew not found")
    runs = db.query(Run).filter(Run.crew_id == crew_id).all()
    total_runs = len(runs)
    durations = []
    for run in runs:
        if run.started_at and run.finished_at:
            durations.append((run.finished_at - run.started_at).total_seconds())
    avg_duration = sum(durations) / len(durations) if durations else 0.0
    daily_runs = get_quota(user.org_id, "runs")
    return {
        "runs": total_runs,
        "avg_duration_s": avg_duration,
        "runs_today": daily_runs,
    }


@router.post("/{crew_id}/apikey")
def rotate_api_key(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    crew = db.get(Crew, crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(404, "Crew not found")
    enforce_rate(user.user_id, "crews.rotate_key", rpm=15, cap=30)
    token = "crew_" + secrets.token_urlsafe(24)
    crew.api_key = token
    db.commit()
    db.refresh(crew)
    return {"api_key": token}
