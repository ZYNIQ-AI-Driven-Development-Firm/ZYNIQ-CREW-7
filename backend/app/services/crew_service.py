from __future__ import annotations

import asyncio
import time
from uuid import UUID

from sqlalchemy.orm import Session

from app.config import settings
from app.models.crew import Crew
from app.models.run import Run, RunStatus
from app.schemas.crew import CrewCreate
from app.schemas.run import RunCreate
from app.services.memory_service import kv_set
from app.services.orchestrator_service import orchestrate_run
from app.services.jobs import get_queue
from app.services.billing import bill_run
from app.services.agent_service import create_default_agents_for_crew


def create_crew(db: Session, payload: CrewCreate, owner_id: str, org_id: str) -> Crew:
    crew = Crew(
        name=payload.name,
        role=payload.role,
        recipe_json=payload.recipe_json,
        is_public=payload.is_public,
        models_json=payload.models_json,
        tools_json=payload.tools_json,
        env_json=payload.env_json,
        owner_id=owner_id,
        org_id=org_id,
    )
    db.add(crew)
    db.commit()
    db.refresh(crew)
    kv_set(crew.kv_namespace, "created_at", {"ts": time.time()})
    
    # Create default 7-agent formation for this crew
    try:
        create_default_agents_for_crew(db, crew.id, crew.role)
    except Exception as e:
        print(f"ERROR creating default agents: {e}")
        import traceback
        traceback.print_exc()
    
    return crew


def fork_crew(db: Session, crew_id: UUID, new_name: str, owner_id: str, org_id: str) -> Crew:
    base = db.get(Crew, crew_id)
    if base is None:
        raise ValueError("Base crew not found")
    clone = Crew(
        name=new_name,
        role=base.role,
        recipe_json=base.recipe_json,
        is_public=False,
        base_crew_id=base.id,
        models_json=base.models_json,
        tools_json=base.tools_json,
        env_json=base.env_json,
        owner_id=owner_id,
        org_id=org_id,
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    kv_set(clone.kv_namespace, "forked_from", {"crew_id": str(base.id)})
    
    # Create default 7-agent formation for the forked crew
    create_default_agents_for_crew(db, clone.id, clone.role)
    
    return clone


def list_crews(db: Session, org_id: str) -> list[Crew]:
    return (
        db.query(Crew)
        .filter((Crew.org_id == org_id) | (Crew.is_public.is_(True)))
        .order_by(Crew.name)
        .all()
    )


def start_run(
    db: Session,
    crew_id: UUID,
    payload: RunCreate,
    *,
    org_id: str | None = None,
    charge: bool = True,
) -> Run:
    if charge and org_id:
        bill_run(db, org_id, settings.CREDITS_PER_RUN)
    run = Run(crew_id=crew_id, status=RunStatus.queued, prompt=payload.prompt)
    db.add(run)
    db.commit()
    db.refresh(run)
    inputs = payload.inputs or {}
    # enqueue a background job instead of in-process streaming
    q = get_queue()
    # enqueue the orchestrator (importable by worker)
    q.enqueue(orchestrate_run, str(run.id), str(crew_id), payload.prompt, inputs, job_timeout=60 * 30)
    return run
