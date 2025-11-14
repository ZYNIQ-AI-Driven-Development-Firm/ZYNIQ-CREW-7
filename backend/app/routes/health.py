from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.infra.db import engine
from app.infra.redis_client import get_redis

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/live")
def live():
    return {"ok": True}


@router.get("/ready")
def ready():
    # DB check
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    # Redis check
    r = get_redis()
    r.ping()
    return {"ok": True}
