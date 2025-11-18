from __future__ import annotations

import os
import pathlib
import shutil
import time

from git import Repo
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from app.services.sandbox import Sandbox, crew_workspace_root
from app.services.tool_events import ToolEventEmitter

tracer = trace.get_tracer(__name__)


def tool_git_clone(
    crew_id: str,
    url: str,
    branch: str = "main",
    depth: int = 1,
    run_id: str | None = None,
    agent_id: str | None = None,
) -> dict:
    with tracer.start_as_current_span("tool.git_clone") as span:
        span.set_attribute("crew_id", crew_id)
        span.set_attribute("repo_url", url)
        span.set_attribute("branch", branch)
        span.set_attribute("depth", depth)
        
        emitter = ToolEventEmitter(crew_id, run_id, agent_id)
        emitter.emit_tool_start("git_clone", {"url": url, "branch": branch, "depth": depth})
        
        start_time = time.perf_counter()
        try:
            workspace = crew_workspace_root(crew_id)
            dst = pathlib.Path(workspace) / "repo"
            if dst.exists():
                for entry in dst.iterdir():
                    if entry.is_file():
                        entry.unlink()
                    else:
                        shutil.rmtree(entry)
            Repo.clone_from(url, str(dst), branch=branch, depth=depth, no_single_branch=True)
            
            duration = time.perf_counter() - start_time
            span.set_attribute("path", str(dst))
            span.set_status(Status(StatusCode.OK))
            
            emitter.emit_tool_end("git_clone", duration, exit_code=0, status="success")
            return {"path": str(dst)}
        except Exception as exc:
            duration = time.perf_counter() - start_time
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            span.record_exception(exc)
            
            emitter.emit_tool_end("git_clone", duration, status="error", error=str(exc))
            raise


def tool_pytest(
    crew_id: str,
    path: str = "repo",
    network: bool = False,
    run_id: str | None = None,
    agent_id: str | None = None,
) -> dict:
    with tracer.start_as_current_span("tool.pytest") as span:
        span.set_attribute("crew_id", crew_id)
        span.set_attribute("path", path)
        span.set_attribute("network", network)
        
        emitter = ToolEventEmitter(crew_id, run_id, agent_id)
        emitter.emit_tool_start("pytest", {"path": path, "network": network})
        
        start_time = time.perf_counter()
        try:
            workspace = crew_workspace_root(crew_id)
            sandbox = Sandbox(workspace, timeout_s=120, network=network)
            commands = [
                ["bash", "-lc", "python -V && pip -V"],
                [
                    "bash",
                    "-lc",
                    "if [ -f requirements.txt ]; then pip install -r requirements.txt --no-input; fi",
                ],
                ["bash", "-lc", f"pytest -q {path} --maxfail=1 --disable-warnings"],
            ]
            results = []
            for i, command in enumerate(commands):
                emitter.emit_tool_progress("pytest", f"Running step {i+1}/3: {' '.join(command[:3])}...")
                
                with tracer.start_as_current_span(f"pytest.step_{i}") as step_span:
                    step_span.set_attribute("command", " ".join(command))
                    result = sandbox.run(command)
                    step_span.set_attribute("exit_code", result["code"])
                    step_span.set_attribute("duration_s", result["duration_s"])
                    results.append(result)
                    if result["code"] != 0 and "pytest" in command[-1]:
                        step_span.set_status(Status(StatusCode.ERROR, "Test failed"))
                        break
                    else:
                        step_span.set_status(Status(StatusCode.OK))
            
            duration = time.perf_counter() - start_time
            final_code = results[-1]["code"] if results else -1
            span.set_attribute("exit_code", final_code)
            span.set_attribute("steps_count", len(results))
            
            if final_code == 0:
                span.set_status(Status(StatusCode.OK))
                emitter.emit_tool_end("pytest", duration, exit_code=final_code, status="success")
            else:
                span.set_status(Status(StatusCode.ERROR, f"Exit code: {final_code}"))
                emitter.emit_tool_end("pytest", duration, exit_code=final_code, status="completed_with_errors")
            
            return {"steps": results}
        except Exception as exc:
            duration = time.perf_counter() - start_time
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            span.record_exception(exc)
            
            emitter.emit_tool_end("pytest", duration, status="error", error=str(exc))
            raise


def tool_script(
    crew_id: str,
    script: str,
    network: bool = False,
    run_id: str | None = None,
    agent_id: str | None = None,
) -> dict:
    with tracer.start_as_current_span("tool.script") as span:
        span.set_attribute("crew_id", crew_id)
        span.set_attribute("network", network)
        span.set_attribute("script_length", len(script))
        
        emitter = ToolEventEmitter(crew_id, run_id, agent_id)
        emitter.emit_tool_start("script", {"network": network, "script_length": len(script)})
        
        start_time = time.perf_counter()
        try:
            workspace = crew_workspace_root(crew_id)
            sandbox = Sandbox(workspace, timeout_s=60, network=network)
            script_path = pathlib.Path(workspace) / "script.sh"
            script_path.write_text(script, encoding="utf-8")
            os.chmod(script_path, 0o755)
            
            result = sandbox.run(["bash", "-lc", "./script.sh"])
            
            duration = time.perf_counter() - start_time
            span.set_attribute("exit_code", result["code"])
            span.set_attribute("duration_s", result["duration_s"])
            
            if result["code"] == 0:
                span.set_status(Status(StatusCode.OK))
                emitter.emit_tool_end("script", duration, exit_code=result["code"], status="success")
            else:
                span.set_status(Status(StatusCode.ERROR, f"Exit code: {result['code']}"))
                emitter.emit_tool_end("script", duration, exit_code=result["code"], status="completed_with_errors")
            
            return result
        except Exception as exc:
            duration = time.perf_counter() - start_time
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            span.record_exception(exc)
            
            emitter.emit_tool_end("script", duration, status="error", error=str(exc))
            raise
