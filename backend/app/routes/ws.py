import asyncio
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.deps import UserCtx
from app.infra.db import SessionLocal
from app.models.crew import Crew
from app.models.run import Run, RunStatus
from app.services.auth_service import parse_token
from app.services.mission_bus import mission_bus
from app.services.pubsub import bus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/runs/{run_id}")
async def ws_run(ws: WebSocket, run_id: UUID) -> None:
    await ws.accept()
    try:
        await ws.send_json({"type": "boot"})
        async for evt in bus.consume(run_id):
            await ws.send_json(evt)
            if evt.get("type") == "done":
                break
    except WebSocketDisconnect:
        return


def _extract_token(ws: WebSocket) -> tuple[str | None, str | None]:
    header = ws.headers.get("sec-websocket-protocol")
    if not header:
        return None, None
    parts = [piece.strip() for piece in header.split(",") if piece.strip()]
    if not parts:
        return None, None
    protocol = parts[0]
    token = parts[1] if len(parts) > 1 else None
    return protocol, token


def _decode_token(token: str | None) -> UserCtx | None:
    if not token:
        return None
    try:
        payload = parse_token(token)
    except Exception:  # noqa: BLE001 - handshake should fail on bad token
        return None
    return UserCtx(user_id=payload["sub"], org_id=payload["org"], role=payload.get("role", "member"))


def _initial_signal(org_id: str) -> dict[str, Any]:
    session = SessionLocal()
    try:
        crew = session.query(Crew).filter(Crew.org_id == org_id).first()
        if not crew:
            return {"type": "signal", "payload": {"status": "offline"}}
        run = (
            session.query(Run)
            .filter(Run.crew_id == crew.id, Run.status == RunStatus.running)
            .order_by(Run.started_at.desc())
            .first()
        )
        status = "busy" if run else "available"
        return {
            "type": "signal",
            "payload": {"status": status, "crewId": str(crew.id)},
        }
    finally:
        session.close()


@router.websocket("/mission")
async def ws_mission(ws: WebSocket) -> None:
    protocol, token = _extract_token(ws)
    user_ctx = _decode_token(token)
    if user_ctx is None:
        logger.warning("Mission WebSocket: unauthorized connection attempt")
        await ws.close(code=4401, reason="unauthorized")
        return

    await ws.accept(subprotocol=protocol)
    logger.info(f"Mission WebSocket: connected for org_id={user_ctx.org_id}")

    subscription = await mission_bus.subscribe(user_ctx.org_id)
    queue = subscription.queue
    try:
        last_signal = _initial_signal(user_ctx.org_id)
        await ws.send_json(last_signal)
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=45.0)
                await ws.send_json(message)
                logger.debug(f"Mission WebSocket: sent {message.get('type')} to org_id={user_ctx.org_id}")
                if message.get("type") == "signal":
                    last_signal = message
            except asyncio.TimeoutError:
                await ws.send_json(last_signal)
    except WebSocketDisconnect:
        logger.info(f"Mission WebSocket: disconnected for org_id={user_ctx.org_id}")
    except Exception as exc:
        logger.error(f"Mission WebSocket: error for org_id={user_ctx.org_id}: {exc!r}")
    finally:
        await mission_bus.unsubscribe(subscription)


@router.websocket("/graph")
async def ws_graph(ws: WebSocket, crew_id: str) -> None:
    """WebSocket endpoint for live graph updates during run execution."""
    protocol, token = _extract_token(ws)
    user_ctx = _decode_token(token)
    if user_ctx is None:
        logger.warning("Graph WebSocket: unauthorized connection attempt")
        await ws.close(code=4401, reason="unauthorized")
        return

    await ws.accept(subprotocol=protocol)
    logger.info(f"Graph WebSocket: connected for crew_id={crew_id}, org_id={user_ctx.org_id}")

    # Subscribe to graph events for this crew
    from app.infra.redis_client import get_redis_client
    
    redis = get_redis_client()
    channel = f"graph:{crew_id}"
    pubsub = redis.pubsub()
    
    try:
        await pubsub.subscribe(channel)
        logger.info(f"Graph WebSocket: subscribed to {channel}")
        
        # Listen for graph events and forward to WebSocket
        while True:
            try:
                message = await asyncio.wait_for(pubsub.get_message(ignore_subscribe_messages=True), timeout=30.0)
                
                if message and message["type"] == "message":
                    # Forward the graph event to WebSocket client
                    import json
                    event = json.loads(message["data"])
                    await ws.send_json(event)
                    logger.info(f"Graph WebSocket: forwarded event {event.get('type')} for crew {crew_id}")
                elif message is None:
                    # Heartbeat
                    await ws.send_json({"type": "ping"})
                    
            except asyncio.TimeoutError:
                # Send heartbeat
                await ws.send_json({"type": "ping"})
                
    except WebSocketDisconnect:
        logger.info(f"Graph WebSocket: disconnected for crew_id={crew_id}")
    except Exception as exc:
        logger.error(f"Graph WebSocket: error for crew_id={crew_id}: {exc!r}")
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
