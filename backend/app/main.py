from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infra.db import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.routes import (
    agents,
    auth,
    billing,
    crews,
    crew_portfolio,
    dashboard_stats,
    env_setup,
    evals,
    graph,
    health,
    marketplace,
    memory,
    metadata,
    pricing,
    ratings,
    runs,
    settings as settings_routes,
    stream,
    tools,
    # wallet,  # Temporarily disabled - needs UserCtx migration
    ws,
)
from app.services.bootstrap import ensure_seed_crews
from app.services.cache_warming import warm_all_caches
from app.infra.telemetry import setup_logging, setup_tracing
from app.services.metrics import register_metrics_collector
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        resp: Response = await call_next(request)
        
        # Skip CSP for docs endpoints to allow Swagger UI
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return resp
            
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        resp.headers[
            "Content-Security-Policy"
        ] = "default-src 'self'; connect-src 'self' http: https: ws: wss:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
        return resp


setup_logging()
setup_tracing()

# Create all database tables (with checkfirst to avoid duplicate creation)
try:
    Base.metadata.create_all(bind=engine, checkfirst=True)
except Exception as e:
    # Log but don't fail if tables already exist
    print(f"Warning during table creation (may be safe to ignore): {e}")

with SessionLocal() as session:
    ensure_seed_crews(session)
    # Warm caches with popular crew metadata
    cache_results = warm_all_caches(session)
    print(f"Cache warming complete: {cache_results}")

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
app.include_router(agents.router)
app.include_router(crews.router)
app.include_router(crew_portfolio.router)
app.include_router(env_setup.router)
# app.include_router(wallet.router)  # Temporarily disabled - needs UserCtx migration
app.include_router(dashboard_stats.router)
app.include_router(tools.router)
app.include_router(evals.router)
app.include_router(billing.router)
app.include_router(marketplace.router)
app.include_router(memory.router)
app.include_router(metadata.router)
app.include_router(pricing.router)
app.include_router(ratings.router)
app.include_router(runs.router)
app.include_router(settings_routes.router)
app.include_router(graph.router)
app.include_router(stream.router)
app.include_router(ws.router)
