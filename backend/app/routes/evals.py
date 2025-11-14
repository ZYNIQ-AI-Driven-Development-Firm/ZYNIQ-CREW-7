from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.deps import UserCtx, auth, get_db
from app.models.evalcase import EvalCase
from app.schemas.run import RunCreate
from app.services.audit import audit
from app.services.crew_service import start_run

router = APIRouter(prefix="/evals", tags=["evals"])


def _require_admin(user: UserCtx) -> None:
    if user.role not in {"owner", "admin"}:
        raise HTTPException(403, "forbidden")


class EvalCreate(BaseModel):
    name: str
    input_json: dict
    expected_json: dict


@router.post("/{crew_id}/cases")
def add_case(
    crew_id: UUID,
    body: EvalCreate,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> dict:
    _require_admin(user)
    case = EvalCase(
        crew_id=str(crew_id),
        name=body.name,
        input_json=body.input_json,
        expected_json=body.expected_json,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    audit(db, user, "eval.case_create", {"crew_id": str(crew_id), "case_id": str(case.id)})
    return {"id": str(case.id)}


@router.post("/{crew_id}/run")
def eval_run(
    crew_id: UUID,
    user: UserCtx = Depends(auth),
    db: Session = Depends(get_db),
) -> dict:
    _require_admin(user)
    cases = db.query(EvalCase).filter(EvalCase.crew_id == str(crew_id)).all()
    if not cases:
        raise HTTPException(404, "no evalcases")
    queued = 0
    for case in cases:
        payload = RunCreate(prompt=case.input_json.get("prompt", ""), inputs=case.input_json)
        start_run(db, crew_id, payload, org_id=user.org_id, charge=False)
        queued += 1
    audit(db, user, "eval.run", {"crew_id": str(crew_id), "count": queued})
    return {"queued": queued}
