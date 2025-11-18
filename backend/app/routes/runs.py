from __future__ import annotations

import hmac
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, crew_api_key, get_db, optional_auth
from app.models.crew import Crew
from app.models.run import Run, RunStatus
from app.schemas.run import RunCreate, RunOut
from app.services.artifact_service import list_artifacts, put_artifact
from app.services.crew_service import start_run
from app.services.limits import add_quota, enforce_rate

router = APIRouter(prefix="/runs", tags=["runs"])


def _to_out(run: Run) -> RunOut:
    return RunOut(
        id=run.id,
        crew_id=run.crew_id,
        status=run.status.value,
        prompt=run.prompt,
        started_at=run.started_at,
        finished_at=run.finished_at,
    )


def _authorize(crew: Crew, user: UserCtx | None, api_key: str | None) -> None:
    if user and crew.org_id == user.org_id:
        return
    if api_key and crew.api_key and hmac.compare_digest(api_key, crew.api_key):
        return
    raise HTTPException(403, "forbidden")


@router.post("/crew/{crew_id}", response_model=RunOut)
async def start(
    crew_id: UUID,
    payload: RunCreate,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
    api_key: str | None = Depends(crew_api_key),
) -> RunOut:
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    _authorize(crew, user, api_key)
    identity = user.user_id if user else (api_key or str(crew_id))
    enforce_rate(identity, "runs.start", rpm=30, cap=60)
    if crew.org_id:
        add_quota(crew.org_id, "runs", delta=1, limit=5000)
    billing_org = user.org_id if user else crew.org_id
    run = start_run(db, crew_id, payload, org_id=billing_org)
    return _to_out(run)


@router.get("/stats", response_model=dict[str, Any])
def get_stats(
    db: Session = Depends(get_db),
    user: UserCtx = Depends(auth),
) -> dict[str, Any]:
    """Return aggregated statistics for the user's organization runs."""
    total = db.query(func.count(Run.id)).join(Crew).filter(Crew.org_id == user.org_id).scalar() or 0
    succeeded = (
        db.query(func.count(Run.id))
        .join(Crew)
        .filter(Crew.org_id == user.org_id, Run.status == RunStatus.succeeded)
        .scalar()
        or 0
    )
    
    # Calculate average latency in milliseconds
    avg_duration = (
        db.query(func.avg(func.extract('epoch', Run.finished_at - Run.started_at)))
        .join(Crew)
        .filter(
            Crew.org_id == user.org_id,
            Run.status == RunStatus.succeeded,
            Run.finished_at.isnot(None),
            Run.started_at.isnot(None),
        )
        .scalar()
    )
    avg_latency_ms = int(avg_duration * 1000) if avg_duration else 0
    
    # Sum total tokens from all runs
    total_tokens = (
        db.query(func.sum(Run.total_tokens))
        .join(Crew)
        .filter(Crew.org_id == user.org_id)
        .scalar()
        or 0
    )
    
    success_rate = round((succeeded / total * 100), 1) if total > 0 else 0.0
    
    return {
        "success_rate": success_rate,
        "avg_latency_ms": avg_latency_ms,
        "total_tokens": total_tokens,
        "total_runs": total,
    }


@router.get("/{run_id}", response_model=RunOut)
def status(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
    api_key: str | None = Depends(crew_api_key),
) -> RunOut:
    obj = db.get(Run, run_id)
    if not obj:
        raise HTTPException(404, "Run not found")
    crew = db.get(Crew, obj.crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    _authorize(crew, user, api_key)
    return _to_out(obj)


@router.post("/{run_id}/artifacts")
async def upload_artifact(
    run_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
    api_key: str | None = Depends(crew_api_key),
) -> dict[str, str]:
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    crew = db.get(Crew, run.crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    _authorize(crew, user, api_key)
    content = await file.read()
    uri = put_artifact(
        run_id,
        file.filename,
        content,
        file.content_type or "application/octet-stream",
    )
    return {"uri": uri}


@router.get("/{run_id}/artifacts")
def get_artifacts(
    run_id: UUID,
    db: Session = Depends(get_db),
    user: UserCtx | None = Depends(optional_auth),
    api_key: str | None = Depends(crew_api_key),
) -> dict[str, Any]:
    """Retrieve all artifacts for a run, grouped by category."""
    run = db.get(Run, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    crew = db.get(Crew, run.crew_id)
    if not crew:
        raise HTTPException(404, "Crew not found")
    _authorize(crew, user, api_key)
    
    # Get all artifacts
    artifacts = list_artifacts(run_id)
    
    # Group by category based on path
    grouped: dict[str, list[dict[str, Any]]] = {
        'backend': [],
        'frontend': [],
        'tests': [],
        'infra': [],
        'docs': [],
    }
    
    for artifact in artifacts:
        path = artifact['path']
        
        # Determine language from extension
        ext = path.split('.')[-1].lower() if '.' in path else ''
        language_map = {
            'py': 'python',
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'md': 'markdown',
            'sql': 'sql',
            'yml': 'yaml',
            'yaml': 'yaml',
        }
        language = language_map.get(ext, 'plaintext')
        
        artifact_data = {
            'path': path,
            'content': artifact['content'],
            'language': language,
        }
        
        # Categorize based on path or extension
        if any(x in path.lower() for x in ['backend', 'api', 'server', 'app.py', 'models.py']):
            grouped['backend'].append(artifact_data)
        elif any(x in path.lower() for x in ['frontend', 'client', 'components', 'app.tsx', 'index.html']):
            grouped['frontend'].append(artifact_data)
        elif any(x in path.lower() for x in ['test', 'spec']):
            grouped['tests'].append(artifact_data)
        elif any(x in path.lower() for x in ['docker', 'deploy', 'infra', 'config']):
            grouped['infra'].append(artifact_data)
        elif ext in ['md', 'txt', 'rst']:
            grouped['docs'].append(artifact_data)
        else:
            # Default to backend if unclear
            grouped['backend'].append(artifact_data)
    
    return {
        'run_id': str(run_id),
        'artifacts': grouped,
        'updated_at': run.finished_at.isoformat() if run.finished_at else None,
    }

