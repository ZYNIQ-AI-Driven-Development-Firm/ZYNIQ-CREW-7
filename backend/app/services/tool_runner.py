from __future__ import annotations

import os
import pathlib
import shutil

from git import Repo

from app.services.sandbox import Sandbox, crew_workspace_root


def tool_git_clone(crew_id: str, url: str, branch: str = "main", depth: int = 1) -> dict:
    workspace = crew_workspace_root(crew_id)
    dst = pathlib.Path(workspace) / "repo"
    if dst.exists():
        for entry in dst.iterdir():
            if entry.is_file():
                entry.unlink()
            else:
                shutil.rmtree(entry)
    Repo.clone_from(url, str(dst), branch=branch, depth=depth, no_single_branch=True)
    return {"path": str(dst)}


def tool_pytest(crew_id: str, path: str = "repo", network: bool = False) -> dict:
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
    for command in commands:
        result = sandbox.run(command)
        results.append(result)
        if result["code"] != 0 and "pytest" in command[-1]:
            break
    return {"steps": results}


def tool_script(crew_id: str, script: str, network: bool = False) -> dict:
    workspace = crew_workspace_root(crew_id)
    sandbox = Sandbox(workspace, timeout_s=60, network=network)
    script_path = pathlib.Path(workspace) / "script.sh"
    script_path.write_text(script, encoding="utf-8")
    os.chmod(script_path, 0o755)
    return sandbox.run(["bash", "-lc", "./script.sh"])
