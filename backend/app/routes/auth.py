from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.deps import auth, get_db, UserCtx
from app.models.user import User
from app.services.auth_service import mk_token, register, verify_pw

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    password: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register_user(body: RegisterIn, db: Session = Depends(get_db)) -> dict[str, str]:
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(409, "exists")
    user = register(db, body.email, body.password)
    return {"id": str(user.id)}


@router.post("/login")
def login_user(body: LoginIn, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(401, "invalid")
    if not verify_pw(body.password, user.password_hash):
        raise HTTPException(401, "invalid")
    return {
        "access": mk_token(str(user.id), user.org_id, user.role, "access"),
        "refresh": mk_token(str(user.id), user.org_id, user.role, "refresh"),
    }


@router.get("/me")
def get_current_user(ctx: UserCtx = Depends(auth), db: Session = Depends(get_db)) -> dict[str, str]:
    """Get current user information from token."""
    user = db.query(User).filter(User.id == ctx.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return {
        "id": str(user.id),
        "email": user.email,
        "org_id": user.org_id,
        "role": user.role,
    }
