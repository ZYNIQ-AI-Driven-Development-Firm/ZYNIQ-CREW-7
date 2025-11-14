from __future__ import annotations

from typing import Iterator

from fastapi import Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.infra.db import SessionLocal
from app.services.auth_service import parse_token


class UserCtx(BaseModel):
    user_id: str
    org_id: str
    role: str


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _decode_token(token: str) -> UserCtx:
    try:
        payload = parse_token(token)
    except Exception as exc:  # noqa: BLE001 - surface as auth failure
        raise HTTPException(401, "unauthorized") from exc
    return UserCtx(user_id=payload["sub"], org_id=payload["org"], role=payload.get("role", "member"))


def auth(authorization: str = Header(alias="Authorization")) -> UserCtx:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "unauthorized")
    token = authorization.split(" ", 1)[1]
    return _decode_token(token)


def optional_auth(authorization: str = Header(default=None, alias="Authorization")) -> UserCtx | None:
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "unauthorized")
    token = authorization.split(" ", 1)[1]
    return _decode_token(token)


def crew_api_key(api_key: str | None = Header(default=None, alias="X-Crew-Key")) -> str | None:
    return api_key
