from __future__ import annotations

import time
from typing import Any

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User

JWT_ALG = "HS256"
ACCESS_TTL = 60 * 30
REFRESH_TTL = 60 * 60 * 24 * 7


def hash_pw(password: str) -> str:
    # Bcrypt has a 72-byte limit, truncate password if necessary
    pwd_bytes = password[:72].encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')


def verify_pw(password: str, hashed: str) -> bool:
    # Bcrypt has a 72-byte limit, truncate password if necessary
    pwd_bytes = password[:72].encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed.encode('utf-8'))


def _make_payload(user_id: str, org_id: str, role: str, kind: str, ttl: int) -> dict[str, Any]:
    return {
        "sub": user_id,
        "org": org_id,
        "role": role,
        "typ": kind,
        "exp": int(time.time()) + ttl,
    }


def mk_token(user_id: str, org_id: str, role: str, kind: str = "access") -> str:
    ttl = ACCESS_TTL if kind == "access" else REFRESH_TTL
    payload = _make_payload(user_id, org_id, role, kind, ttl)
    return jwt.encode(payload, settings.APP_SECRET, algorithm=JWT_ALG)


def parse_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.APP_SECRET, algorithms=[JWT_ALG])


def register(db: Session, email: str, password: str) -> User:
    user = User(email=email, password_hash=hash_pw(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
