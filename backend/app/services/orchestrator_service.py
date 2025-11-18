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
from app.services.memory_service import kv_set, vec_upsert, add_crew_memory, add_mission_memory
from app.services.embedding_service import generate_embedding
from app.services.mission_bus import publish_alert, publish_signal
from app.services.pubsub import bus
from app.services.metrics import record_run_started, record_run_done
from app.crewai.adapters import upsert_memory
from app.crewai.factory import make_crew
from app.crewai.fullstack_crew import make_fullstack_saas_crew
from app.crewai.toolpacks import default_toolpacks
from app.infra.redis_client import get_redis, get_redis_client


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
    
    # Publish graph start event
    await _publish_graph_event(crew_id, {
        "type": "run_start",
        "run_id": str(run_id),
        "timestamp": _now().isoformat()
    })
    
    final_text = ""
    try:
        for kind, data in run_orchestration(crew_id, rendered_prompt, run_id):
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
        
        # Publish graph error event
        await _publish_graph_event(crew_id, {
            "type": "run_error",
            "run_id": str(run_id),
            "error": str(exc),
            "timestamp": _now().isoformat()
        })
        
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
    
    # Publish graph completion event
    await _publish_graph_event(crew_id, {
        "type": "run_complete",
        "run_id": str(run_id),
        "timestamp": _now().isoformat()
    })
    
    if org_id:
        await publish_signal(org_id, "available", str(crew_id))


def run_orchestration(crew_id: UUID, prompt: str, run_id: UUID) -> Generator[tuple[str, str], None, None]:
    """
    Run crew orchestration with specialized crew detection.
    Detects Full-Stack SaaS Crew and uses appropriate factory.
    """
    tools = default_toolpacks()
    
    # Get crew details to check type
    with SessionLocal() as db:
        crew_obj = db.get(Crew, crew_id)
        crew_type = None
        if crew_obj and crew_obj.recipe_json:
            crew_type = crew_obj.recipe_json.get("crew_type")
    
    # Use specialized crew for Full-Stack SaaS
    if crew_type == "fullstack_saas":
        yield ("log", "🚀 Initializing Full-Stack SaaS Crew (7 specialized agents)...")
        crew = make_fullstack_saas_crew(str(crew_id), prompt, tools)
        agents = [
            "orchestrator",
            "backend_architect", 
            "backend_implementer",
            "frontend_architect",
            "frontend_implementer",
            "qa_engineer",
            "devops_engineer"
        ]
    else:
        yield ("log", "Crew planning…")
        crew = make_crew(str(crew_id), prompt, tools)
        agents = ["orchestrator", "backend_dev", "frontend_dev", "qa_engineer", "devops_engineer"]
    
    # Simulate agent lifecycle with graph events
    agents = ["orchestrator", "backend_dev", "frontend_dev", "qa_engineer", "devops_engineer"]
    
    for agent in agents:
        # Publish agent start
        asyncio.create_task(_publish_graph_event(crew_id, {
            "type": "agent_start",
            "agent": agent,
            "run_id": str(run_id),
            "timestamp": _now().isoformat()
        }))
        
        yield ("log", f"Agent {agent} starting...")
        
        # Simulate agent work
        import time
        time.sleep(0.5)
        
        # Publish agent completion with token count
        asyncio.create_task(_publish_graph_event(crew_id, {
            "type": "agent_end",
            "agent": agent,
            "run_id": str(run_id),
            "status": "done",
            "tokens": 150,
            "timestamp": _now().isoformat()
        }))
        
        # Publish edge to next agent
        if agents.index(agent) < len(agents) - 1:
            next_agent = agents[agents.index(agent) + 1]
            asyncio.create_task(_publish_graph_event(crew_id, {
                "type": "edge",
                "source": agent,
                "target": next_agent,
                "run_id": str(run_id),
                "timestamp": _now().isoformat()
            }))
    
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
    """
    Persist run memory to both Redis (KV) and Qdrant (vector).
    Now uses enhanced memory service for better semantic search.
    """
    kv_namespace = crew_snapshot["kv_namespace"]
    vec_collection = crew_snapshot["vector_collection"]
    crew_id = str(crew_snapshot.get("crew_id", "unknown"))

    # Store in Redis KV for fast lookup
    kv_set(
        kv_namespace,
        f"run:{run_id}:summary",
        {"prompt": prompt, "output": output_text, "ts": _now().isoformat()},
    )

    if not output_text:
        return

    # Generate embedding for semantic search
    try:
        embedding = generate_embedding(output_text)
        
        # Add to crew's long-term memory
        add_crew_memory(
            crew_id=crew_id,
            content=output_text,
            embedding=embedding,
            metadata={
                "run_id": str(run_id),
                "prompt": prompt,
                "type": "run_output",
                "success": True,
            },
            mission_id=str(run_id),
            agent_role="orchestrator",
        )
        
        # Also add to mission-specific memory
        add_mission_memory(
            mission_id=str(run_id),
            content=f"User Request: {prompt}\n\nResult: {output_text}",
            embedding=embedding,
            metadata={
                "type": "mission_transcript",
                "crew_id": crew_id,
            },
            agent_role="orchestrator",
        )
        
    except Exception as e:  # noqa: BLE001 - fallback to old method if new memory fails
        print(f"Warning: Enhanced memory failed, falling back to legacy: {e}")
        
        # Fallback to old vector upsert
        try:
            vector = await get_ollama_client().embed(settings.MODEL_EMBED, output_text)
        except Exception:
            vector = [0.0] * 384
        
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


async def _publish_graph_event(crew_id: UUID, event: dict[str, Any]) -> None:
    """Publish graph event to Redis channel for WebSocket subscribers."""
    try:
        redis = get_redis_client()
        channel = f"graph:{crew_id}"
        await redis.publish(channel, json.dumps(event))
    except Exception:  # noqa: BLE001 - don't fail run if graph event fails
        pass
