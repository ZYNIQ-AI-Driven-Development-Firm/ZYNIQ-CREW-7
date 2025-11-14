from __future__ import annotations

import os
from typing import Any

import requests
from langchain.tools import tool

API_BASE = os.getenv("CREW7_INTERNAL_API", "http://localhost:8080")


def _post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    resp = requests.post(f"{API_BASE}{path}", json=payload, timeout=180)
    resp.raise_for_status()
    return resp.json()


@tool("git_clone")
def git_clone(crew_id: str, repo_url: str, branch: str = "main", depth: int = 1) -> str:
    """Clone a repository into the crew sandbox."""
    result = _post(
        "/tools/git/clone",
        {"crew_id": crew_id, "repo_url": repo_url, "branch": branch, "depth": depth},
    )
    return f"cloned to {result['path']}"


@tool("pytest_run")
def pytest_run(crew_id: str, path: str = "repo") -> str:
    """Run pytest inside the sandbox."""
    result = _post("/tools/pytest/run", {"crew_id": crew_id, "path": path})
    return str(result)


@tool("script_run")
def script_run(crew_id: str, script: str) -> str:
    """Execute a bash script inside the sandbox."""
    result = _post("/tools/script/run", {"crew_id": crew_id, "script": script})
    return f"exit={result['code']}\nstdout:\n{result['stdout']}\nstderr:\n{result['stderr']}"
