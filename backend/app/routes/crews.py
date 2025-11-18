from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db, optional_auth
from app.models.crew import Crew
from app.models.run import Run
from app.schemas.crew import CrewCreate, CrewOut, CrewPatch
from app.schemas.run import RunCreate, RunOut
from app.services.crew_service import create_crew, fork_crew, list_crews, start_run
from app.services.limits import add_quota, enforce_rate, get_quota
from app.services.cache_service import get_cache_service

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
    
    # Invalidate cached metadata and pricing when crew is updated
    cache = get_cache_service()
    cache.invalidate_all_crew_metadata(obj.id)
    cache.invalidate_crew_pricing(obj.id)
    
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


@router.post("/fullstack/run", response_model=RunOut)
def run_fullstack_crew(
    payload: RunCreate,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> RunOut:
    """
    Start a Full-Stack SaaS Crew mission.
    
    This endpoint creates and runs a specialized 7-agent crew for building
    complete full-stack applications:
    - 1 Orchestrator (Gemini) - Strategic planning & coordination
    - 2 Backend specialists (aimalapi) - Architecture & implementation
    - 2 Frontend specialists (aimalapi) - Architecture & implementation
    - 1 QA Engineer (aimalapi) - Testing
    - 1 DevOps Engineer (aimalapi) - Infrastructure
    
    The crew uses Qdrant for persistent memory and generates production-ready
    code including FastAPI backend, React frontend, tests, and Docker configs.
    """
    enforce_rate(user.user_id, "runs.create", rpm=20, cap=50)
    add_quota(user.org_id, "runs", delta=1, limit=1000)
    
    # Get or create the Full-Stack SaaS Crew
    crew = db.query(Crew).filter(
        Crew.org_id == user.org_id,
        Crew.name == "Full-Stack SaaS Crew"
    ).first()
    
    if not crew:
        # Create the Full-Stack crew if it doesn't exist
        crew_payload = CrewCreate(
            name="Full-Stack SaaS Crew",
            role="Full-Stack Development Team",
            recipe_json={
                "mission": "Build complete full-stack applications with 7 specialized AI agents",
                "instructions": [
                    "Orchestrator plans and coordinates all tasks",
                    "Backend Architect designs API and database",
                    "Backend Implementer writes FastAPI code",
                    "Frontend Architect designs UI/UX structure",
                    "Frontend Implementer builds React components",
                    "QA Engineer creates comprehensive tests",
                    "DevOps Engineer sets up Docker and CI/CD"
                ],
                "crew_type": "fullstack_saas"
            },
            is_public=False,
            models_json={
                "orchestrator": "gemini-1.5-flash",
                "specialists": "gpt-4o-mini"
            },
            tools_json={},
            env_json={}
        )
        crew = create_crew(db, crew_payload, owner_id=user.user_id, org_id=user.org_id)
    
    # Start the run
    run = start_run(db, crew.id, payload, org_id=user.org_id, charge=True)
    
    return RunOut(
        id=run.id,
        crew_id=run.crew_id,
        status=run.status,
        prompt=run.prompt,
        started_at=run.started_at,
        finished_at=run.finished_at,
    )

