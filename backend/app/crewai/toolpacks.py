from __future__ import annotations

from typing import Dict, List

from app.crewai.tools import git_clone, pytest_run, script_run


def default_toolpacks() -> Dict[str, List]:
    return {
        "orchestrator": [],
        "backend": [git_clone, pytest_run, script_run],
        "frontend": [git_clone, script_run],
        "qa": [pytest_run],
        "devops": [script_run],
        "data": [script_run],
        "security": [script_run],
    }
