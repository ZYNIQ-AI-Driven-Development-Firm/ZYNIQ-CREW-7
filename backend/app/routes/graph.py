from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db
from app.infra.db import Base
from app.models.crew import Crew
from app.models.run import Run, RunStatus

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graph", tags=["graph"])


# Graph layout persistence model
class CrewGraph(Base):
    __tablename__ = "crew_graphs"
    
    crew_id = Column(PGUUID(as_uuid=True), primary_key=True)
    org_id = Column(String, nullable=False, index=True)
    layout_json = Column(JSONB, nullable=False, default=dict)


@router.get("/{crew_id}")
def get_layout(
    crew_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx = Depends(auth),
) -> dict[str, Any]:
    """Retrieve the saved graph layout for a crew."""
    crew = db.get(Crew, crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(404, "Crew not found")
    
    graph = db.query(CrewGraph).filter(CrewGraph.crew_id == crew_id).first()
    if not graph:
        # Return default layout
        return {"nodes": [], "edges": []}
    
    return graph.layout_json or {"nodes": [], "edges": []}


@router.put("/{crew_id}")
def save_layout(
    crew_id: UUID,
    layout: dict[str, Any],
    db: Session = Depends(get_db),
    user: UserCtx = Depends(auth),
) -> dict[str, str]:
    """Save the graph layout for a crew."""
    crew = db.get(Crew, crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(404, "Crew not found")
    
    graph = db.query(CrewGraph).filter(CrewGraph.crew_id == crew_id).first()
    if graph:
        graph.layout_json = layout
    else:
        graph = CrewGraph(crew_id=crew_id, org_id=user.org_id, layout_json=layout)
        db.add(graph)
    
    db.commit()
    logger.info(f"Saved graph layout for crew_id={crew_id}")
    return {"status": "ok"}


@router.post("/runs/{run_id}/pause")
def pause_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx = Depends(auth),
) -> dict[str, str]:
    """Pause a running execution."""
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    
    crew = db.get(Crew, run.crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(403, "Forbidden")
    
    if run.status != RunStatus.running:
        raise HTTPException(400, "Run is not currently running")
    
    # TODO: Implement actual pause logic via orchestrator signal
    logger.warning(f"Pause requested for run_id={run_id} but not yet implemented")
    return {"status": "pause_requested"}


@router.post("/runs/{run_id}/resume")
def resume_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx = Depends(auth),
) -> dict[str, str]:
    """Resume a paused execution."""
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    
    crew = db.get(Crew, run.crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(403, "Forbidden")
    
    # TODO: Implement actual resume logic
    logger.warning(f"Resume requested for run_id={run_id} but not yet implemented")
    return {"status": "resume_requested"}


@router.post("/runs/{run_id}/cancel")
def cancel_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx = Depends(auth),
) -> dict[str, str]:
    """Cancel a running execution."""
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    
    crew = db.get(Crew, run.crew_id)
    if not crew or crew.org_id != user.org_id:
        raise HTTPException(403, "Forbidden")
    
    if run.status not in (RunStatus.running, RunStatus.queued):
        raise HTTPException(400, "Run cannot be cancelled in current state")
    
    run.status = RunStatus.failed
    db.commit()
    logger.info(f"Cancelled run_id={run_id}")
    return {"status": "cancelled"}
