from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infra.db import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.routes import (
    auth,
    billing,
    crews,
    crew_portfolio,
    evals,
    graph,
    health,
    marketplace,
    runs,
    stream,
    tools,
    wallet,
    ws,
)
from app.services.bootstrap import ensure_seed_crews
from app.infra.telemetry import setup_logging, setup_tracing
from app.services.metrics import register_metrics_collector
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        resp: Response = await call_next(request)
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers[
            "Content-Security-Policy"
        ] = "default-src 'self'; connect-src 'self' http: https: ws: wss:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
        return resp


setup_logging()
setup_tracing()

Base.metadata.create_all(bind=engine)

with SessionLocal() as session:
    ensure_seed_crews(session)

app = FastAPI(title=settings.APP_NAME, version="0.1.0", openapi_url="/openapi.json")

app.add_middleware(SecurityHeaders)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Crew-Key"],
    allow_credentials=True,
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
register_metrics_collector()

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(crews.router)
app.include_router(crew_portfolio.router)
app.include_router(wallet.router)
app.include_router(tools.router)
app.include_router(evals.router)
app.include_router(billing.router)
app.include_router(marketplace.router)
app.include_router(runs.router)
app.include_router(graph.router)
app.include_router(stream.router)
app.include_router(ws.router)
