from __future__ import annotations

import time
from datetime import datetime
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db
from app.services import tool_runner
from app.services.audit import audit

router = APIRouter(prefix="/tools", tags=["tools"])


def _require_admin(user: UserCtx) -> None:
    if user.role not in {"owner", "admin"}:
        raise HTTPException(403, "forbidden")


class GitCloneIn(BaseModel):
    crew_id: UUID
    repo_url: HttpUrl
    branch: str = "main"
    depth: int = 1
    run_id: Optional[UUID] = None
    agent_id: Optional[str] = None


@router.post("/git/clone")
def git_clone(body: GitCloneIn, user: UserCtx = Depends(auth), db: Session = Depends(get_db)):
    _require_admin(user)
    start_time = datetime.utcnow()
    start_perf = time.perf_counter()
    try:
        output = tool_runner.tool_git_clone(
            str(body.crew_id),
            str(body.repo_url),
            body.branch,
            body.depth,
            run_id=str(body.run_id) if body.run_id else None,
            agent_id=body.agent_id,
        )
        duration_s = time.perf_counter() - start_perf
        audit(db, user, "tool.git_clone", {
            "crew_id": str(body.crew_id),
            "run_id": str(body.run_id) if body.run_id else None,
            "agent_id": body.agent_id,
            "repo": str(body.repo_url),
            "branch": body.branch,
            "start_time": start_time.isoformat(),
            "end_time": datetime.utcnow().isoformat(),
            "duration_s": round(duration_s, 3),
            "status": "success",
        })
        return output
    except Exception as exc:  # noqa: BLE001 - surface tool error to client
        duration_s = time.perf_counter() - start_perf
        audit(db, user, "tool.git_clone", {
            "crew_id": str(body.crew_id),
            "run_id": str(body.run_id) if body.run_id else None,
            "agent_id": body.agent_id,
            "repo": str(body.repo_url),
            "start_time": start_time.isoformat(),
            "end_time": datetime.utcnow().isoformat(),
            "duration_s": round(duration_s, 3),
            "status": "error",
            "error": str(exc),
        })
        raise HTTPException(400, str(exc)) from exc


class PytestIn(BaseModel):
    crew_id: UUID
    path: str = "repo"
    network: bool = False
    run_id: Optional[UUID] = None
    agent_id: Optional[str] = None


@router.post("/pytest/run")
def pytest_run(body: PytestIn, user: UserCtx = Depends(auth), db: Session = Depends(get_db)):
    _require_admin(user)
    start_time = datetime.utcnow()
    start_perf = time.perf_counter()
    try:
        output = tool_runner.tool_pytest(
            str(body.crew_id),
            body.path,
            network=body.network,
            run_id=str(body.run_id) if body.run_id else None,
            agent_id=body.agent_id,
        )
        duration_s = time.perf_counter() - start_perf
        exit_code = output.get("steps", [{}])[-1].get("code", -1) if output.get("steps") else -1
        audit(
            db,
            user,
            "tool.pytest",
            {
                "crew_id": str(body.crew_id),
                "run_id": str(body.run_id) if body.run_id else None,
                "agent_id": body.agent_id,
                "path": body.path,
                "network": body.network,
                "start_time": start_time.isoformat(),
                "end_time": datetime.utcnow().isoformat(),
                "duration_s": round(duration_s, 3),
                "exit_code": exit_code,
                "status": "success" if exit_code == 0 else "completed_with_errors",
            },
        )
        return output
    except Exception as exc:  # noqa: BLE001
        duration_s = time.perf_counter() - start_perf
        audit(
            db,
            user,
            "tool.pytest",
            {
                "crew_id": str(body.crew_id),
                "run_id": str(body.run_id) if body.run_id else None,
                "agent_id": body.agent_id,
                "path": body.path,
                "network": body.network,
                "start_time": start_time.isoformat(),
                "end_time": datetime.utcnow().isoformat(),
                "duration_s": round(duration_s, 3),
                "status": "error",
                "error": str(exc),
            },
        )
        raise HTTPException(400, str(exc)) from exc


class ScriptIn(BaseModel):
    crew_id: UUID
    script: str
    network: bool = False
    run_id: Optional[UUID] = None
    agent_id: Optional[str] = None


@router.post("/script/run")
def script_run(body: ScriptIn, user: UserCtx = Depends(auth), db: Session = Depends(get_db)):
    _require_admin(user)
    start_time = datetime.utcnow()
    start_perf = time.perf_counter()
    try:
        output = tool_runner.tool_script(
            str(body.crew_id),
            body.script,
            network=body.network,
            run_id=str(body.run_id) if body.run_id else None,
            agent_id=body.agent_id,
        )
        duration_s = time.perf_counter() - start_perf
        exit_code = output.get("code", -1)
        audit(
            db,
            user,
            "tool.script",
            {
                "crew_id": str(body.crew_id),
                "run_id": str(body.run_id) if body.run_id else None,
                "agent_id": body.agent_id,
                "network": body.network,
                "start_time": start_time.isoformat(),
                "end_time": datetime.utcnow().isoformat(),
                "duration_s": round(duration_s, 3),
                "exit_code": exit_code,
                "status": "success" if exit_code == 0 else "completed_with_errors",
            },
        )
        return output
    except Exception as exc:  # noqa: BLE001
        duration_s = time.perf_counter() - start_perf
        audit(
            db,
            user,
            "tool.script",
            {
                "crew_id": str(body.crew_id),
                "run_id": str(body.run_id) if body.run_id else None,
                "agent_id": body.agent_id,
                "network": body.network,
                "start_time": start_time.isoformat(),
                "end_time": datetime.utcnow().isoformat(),
                "duration_s": round(duration_s, 3),
                "status": "error",
                "error": str(exc),
            },
        )
        raise HTTPException(400, str(exc)) from exc
