from __future__ import annotations

import os
import pathlib
import time
from typing import Optional

import docker


class SandboxError(Exception):
    """Raised when sandbox execution fails."""


class Sandbox:
    def __init__(
        self,
        workspace_host: str,
        *,
        image: str = os.getenv("SANDBOX_IMAGE", "python:3.11-slim"),
        ram_mb: int = 768,
        cpus: float = 0.5,
        timeout_s: int = 60,
        network: bool = False,
    ) -> None:
        self.client = docker.from_env()
        self.image = image
        self.ram_mb = ram_mb
        self.cpus = cpus
        self.timeout_s = timeout_s
        self.network = network
        self.workspace_host = workspace_host
        pathlib.Path(workspace_host).mkdir(parents=True, exist_ok=True)

    def run(self, cmd: list[str], env: Optional[dict] = None) -> dict:
        container = None
        start = time.time()
        try:
            container = self.client.containers.run(
                self.image,
                cmd,
                detach=True,
                stdin_open=False,
                tty=False,
                working_dir="/workspace",
                network_disabled=not self.network,
                volumes={self.workspace_host: {"bind": "/workspace", "mode": "rw"}},
                mem_limit=f"{self.ram_mb}m",
                nano_cpus=int(self.cpus * 1e9),
                environment=env or {},
            )
            exit_code = container.wait(timeout=self.timeout_s)["StatusCode"]
            stdout = container.logs(stdout=True, stderr=False).decode("utf-8", "ignore")
            stderr = container.logs(stdout=False, stderr=True).decode("utf-8", "ignore")
            dur = time.time() - start
            return {"code": exit_code, "stdout": stdout, "stderr": stderr, "duration_s": dur}
        except Exception as exc:  # noqa: BLE001 - sandbox errors reported upstream
            raise SandboxError(str(exc)) from exc
        finally:
            try:
                if container:
                    container.remove(force=True)
            except Exception:
                pass


def crew_workspace_root(crew_id: str) -> str:
    root = os.getenv("WORKSPACES_ROOT", "/tmp/crew7_workspaces")
    path = pathlib.Path(root) / crew_id
    path.mkdir(parents=True, exist_ok=True)
    return str(path)
