from __future__ import annotations

from uuid import UUID

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


@router.post("/git/clone")
def git_clone(body: GitCloneIn, user: UserCtx = Depends(auth), db: Session = Depends(get_db)):
    _require_admin(user)
    try:
        output = tool_runner.tool_git_clone(str(body.crew_id), str(body.repo_url), body.branch, body.depth)
        audit(db, user, "tool.git_clone", {"crew_id": str(body.crew_id), "repo": str(body.repo_url)})
        return output
    except Exception as exc:  # noqa: BLE001 - surface tool error to client
        raise HTTPException(400, str(exc)) from exc


class PytestIn(BaseModel):
    crew_id: UUID
    path: str = "repo"
    network: bool = False


@router.post("/pytest/run")
def pytest_run(body: PytestIn, user: UserCtx = Depends(auth), db: Session = Depends(get_db)):
    _require_admin(user)
    try:
        output = tool_runner.tool_pytest(str(body.crew_id), body.path, network=body.network)
        audit(
            db,
            user,
            "tool.pytest",
            {"crew_id": str(body.crew_id), "path": body.path, "network": body.network},
        )
        return output
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, str(exc)) from exc


class ScriptIn(BaseModel):
    crew_id: UUID
    script: str
    network: bool = False


@router.post("/script/run")
def script_run(body: ScriptIn, user: UserCtx = Depends(auth), db: Session = Depends(get_db)):
    _require_admin(user)
    try:
        output = tool_runner.tool_script(str(body.crew_id), body.script, network=body.network)
        audit(
            db,
            user,
            "tool.script",
            {"crew_id": str(body.crew_id), "network": body.network},
        )
        return output
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, str(exc)) from exc
