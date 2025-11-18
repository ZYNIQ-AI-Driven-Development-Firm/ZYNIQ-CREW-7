from __future__ import annotations

import os
from typing import Any

import requests
from crewai.tools import BaseTool

API_BASE = os.getenv("CREW7_INTERNAL_API", "http://localhost:8080")


def _post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    resp = requests.post(f"{API_BASE}{path}", json=payload, timeout=180)
    resp.raise_for_status()
    return resp.json()


class GitCloneTool(BaseTool):
    name: str = "git_clone"
    description: str = "Clone a repository into the crew sandbox. Args: crew_id (str), repo_url (str), branch (str, default='main'), depth (int, default=1)"

    def _run(self, crew_id: str, repo_url: str, branch: str = "main", depth: int = 1) -> str:
        result = _post(
            "/tools/git/clone",
            {"crew_id": crew_id, "repo_url": repo_url, "branch": branch, "depth": depth},
        )
        return f"cloned to {result['path']}"


class PytestRunTool(BaseTool):
    name: str = "pytest_run"
    description: str = "Run pytest inside the sandbox. Args: crew_id (str), path (str, default='repo')"

    def _run(self, crew_id: str, path: str = "repo") -> str:
        result = _post("/tools/pytest/run", {"crew_id": crew_id, "path": path})
        return str(result)


class ScriptRunTool(BaseTool):
    name: str = "script_run"
    description: str = "Execute a bash script inside the sandbox. Args: crew_id (str), script (str)"

    def _run(self, crew_id: str, script: str) -> str:
        result = _post("/tools/script/run", {"crew_id": crew_id, "script": script})
        return f"exit={result['code']}\nstdout:\n{result['stdout']}\nstderr:\n{result['stderr']}"


# Create instances for use in toolpacks
git_clone = GitCloneTool()
pytest_run = PytestRunTool()
script_run = ScriptRunTool()
