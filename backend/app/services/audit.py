from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.audit import Audit
from app.deps import UserCtx


def audit(db: Session, user: UserCtx, action: str, detail: dict[str, Any]) -> None:
    entry = Audit(user_id=user.user_id, org_id=user.org_id, action=action, detail_json=detail)
    db.add(entry)
    db.commit()
