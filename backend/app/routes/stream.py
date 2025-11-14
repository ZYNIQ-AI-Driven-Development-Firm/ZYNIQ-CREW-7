import json
from typing import AsyncGenerator
from uuid import UUID

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.pubsub import bus

router = APIRouter(prefix="/events", tags=["stream"])


async def sse_gen(run_id: UUID) -> AsyncGenerator[bytes, None]:
    yield b"event: boot\ndata: {}\n\n"
    async for evt in bus.consume(run_id):
        payload = json.dumps(evt).encode()
        yield b"data: " + payload + b"\n\n"
        if evt.get("type") == "done":
            break
    yield b"event: done\ndata: {}\n\n"


@router.get("/runs/{run_id}")
async def stream(run_id: UUID) -> StreamingResponse:
    return StreamingResponse(sse_gen(run_id), media_type="text/event-stream")
