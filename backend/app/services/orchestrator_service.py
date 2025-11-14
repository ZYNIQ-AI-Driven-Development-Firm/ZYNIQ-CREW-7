from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Generator
from uuid import UUID, uuid4

from app.config import settings
from app.infra.db import SessionLocal
from app.infra.ollama import get_ollama_client
from app.models.crew import Crew
from app.models.run import Run, RunStatus
from app.services.memory_service import kv_set, vec_upsert
from app.services.mission_bus import publish_alert, publish_signal
from app.services.pubsub import bus
from app.services.metrics import record_run_started, record_run_done
from app.crewai.adapters import upsert_memory
from app.crewai.factory import make_crew
from app.crewai.toolpacks import default_toolpacks


def orchestrate_run(run_id: str, crew_id: str, prompt: str, inputs: dict[str, Any]) -> None:
    """RQ worker entry point."""
    asyncio.run(_orchestrate_run_async(UUID(run_id), UUID(crew_id), prompt, inputs))


async def _orchestrate_run_async(run_id: UUID, crew_id: UUID, prompt: str, inputs: dict[str, Any]) -> None:
    crew_snapshot = _mark_running_and_snapshot(crew_id, run_id)
    if crew_snapshot is None:
        _mark_failed(run_id, "Crew or run missing")
        await bus.publish(run_id, {"type": "error", "data": "Crew or run missing."})
        await bus.publish(run_id, {"type": "done"})
        return

    rendered_prompt = _render_prompt(prompt, crew_snapshot, inputs)
    org_id = crew_snapshot.get("org_id")

    if org_id:
        await publish_signal(org_id, "busy", str(crew_id))

    await bus.publish(run_id, {"type": "status", "data": "running"})
    record_run_started(str(crew_id))
    final_text = ""
    try:
        for kind, data in run_orchestration(crew_id, rendered_prompt):
            if kind == "log":
                await bus.publish(run_id, {"type": "message", "data": data})
            elif kind == "token":
                final_text += data
                await bus.publish(run_id, {"type": "token", "data": data})
            elif kind == "done":
                if isinstance(data, str):
                    final_text = data
                break
    except Exception as exc:  # noqa: BLE001 - capture orchestration errors
        _mark_failed(run_id, str(exc))
        record_run_done(str(crew_id), "failed")
        await bus.publish(run_id, {"type": "error", "data": str(exc)})
        await bus.publish(run_id, {"type": "status", "data": "failed"})
        await bus.publish(run_id, {"type": "done"})
        if org_id:
            await publish_signal(org_id, "available", str(crew_id))
            await publish_alert(
                org_id,
                "critical",
                "Mission run failed",
                message=str(exc),
                crewId=str(crew_id),
            )
        return

    output_text = final_text.strip()
    if output_text:
        await bus.publish(run_id, {"type": "message", "data": output_text})

    await _persist_memory(crew_snapshot, run_id, prompt, output_text)
    _mark_succeeded(run_id)
    record_run_done(str(crew_id), "succeeded")
    await bus.publish(run_id, {"type": "status", "data": "succeeded"})
    await bus.publish(run_id, {"type": "done"})
    if org_id:
        await publish_signal(org_id, "available", str(crew_id))


def run_orchestration(crew_id: UUID, prompt: str) -> Generator[tuple[str, str], None, None]:
    tools = default_toolpacks()
    crew = make_crew(str(crew_id), prompt, tools)
    yield ("log", "Crew planning…")
    result = crew.kickoff(inputs={"user_request": prompt})
    final_text = result if isinstance(result, str) else str(result)
    upsert_memory(str(crew_id), [final_text])
    for chunk in final_text.split(" "):
        if not chunk:
            continue
        yield ("token", f"{chunk} ")
    yield ("done", final_text)


def _render_prompt(prompt: str, crew_snapshot: dict[str, Any], inputs: dict[str, Any]) -> str:
    recipe = crew_snapshot["recipe"]
    env = crew_snapshot["env"]
    tools = crew_snapshot["tools"]

    segments = []
    if recipe.get("mission"):
        segments.append(f"Mission: {recipe['mission']}")
    if recipe.get("instructions"):
        instructions = recipe["instructions"]
        if isinstance(instructions, list):
            bullet_list = "\n".join(f"- {step}" for step in instructions)
            segments.append(f"Instructions:\n{bullet_list}")
        elif isinstance(instructions, str):
            segments.append(f"Instructions:\n{instructions}")
    if tools:
        tool_lines = "\n".join(f"- {name}: {details}" for name, details in tools.items())
        segments.append(f"Available tools:\n{tool_lines}")
    if env:
        env_lines = "\n".join(f"{key}={value}" for key, value in env.items())
        segments.append(f"Environment:\n{env_lines}")
    if inputs:
        context = json.dumps(inputs, indent=2)
        segments.append(f"Run inputs:\n{context}")

    segments.append(f"Task:\n{prompt}")
    return "\n\n".join(segments)


async def _persist_memory(crew_snapshot: dict[str, Any], run_id: UUID, prompt: str, output_text: str) -> None:
    kv_namespace = crew_snapshot["kv_namespace"]
    vec_collection = crew_snapshot["vector_collection"]

    kv_set(
        kv_namespace,
        f"run:{run_id}:summary",
        {"prompt": prompt, "output": output_text, "ts": _now().isoformat()},
    )

    if not output_text:
        return

    vector = [0.0] * 384
    try:
        vector = await get_ollama_client().embed(settings.MODEL_EMBED, output_text)
    except Exception:  # noqa: BLE001 - fallback to zero vector if embeddings fail
        pass

    vec_upsert(
        vec_collection,
        [
            (
                str(uuid4()),
                vector,
                {
                    "run_id": str(run_id),
                    "prompt": prompt,
                    "output": output_text,
                    "type": "transcript",
                },
            )
        ],
    )


def _mark_running_and_snapshot(crew_id: UUID, run_id: UUID) -> dict[str, Any] | None:
    session = SessionLocal()
    try:
        run = session.get(Run, run_id)
        crew = session.get(Crew, crew_id)
        if run is None or crew is None:
            return None
        run.status = RunStatus.running
        run.started_at = _now()
        session.commit()
        return {
            "recipe": crew.recipe_json or {},
            "models": crew.models_json or {},
            "tools": crew.tools_json or {},
            "env": crew.env_json or {},
            "kv_namespace": crew.kv_namespace,
            "vector_collection": crew.vector_collection,
            "org_id": crew.org_id,
        }
    finally:
        session.close()


def _mark_succeeded(run_id: UUID) -> None:
    session = SessionLocal()
    try:
        run = session.get(Run, run_id)
        if run is None:
            return
        run.status = RunStatus.succeeded
        run.finished_at = _now()
        session.commit()
    finally:
        session.close()


def _mark_failed(run_id: UUID, reason: str) -> None:
    session = SessionLocal()
    try:
        run = session.get(Run, run_id)
        if run is None:
            return
        run.status = RunStatus.failed
        run.finished_at = _now()
        session.commit()
    finally:
        session.close()


def _now() -> datetime:
    return datetime.now(timezone.utc)
