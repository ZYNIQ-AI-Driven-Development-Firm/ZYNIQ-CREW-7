from __future__ import annotations

from pathlib import Path

from .base import Tool, ToolError

SAFE_ROOT = Path("/tmp/crew7_workspace")
SAFE_ROOT.mkdir(parents=True, exist_ok=True)


class FileWrite(Tool):
    name = "file_write"

    async def __call__(self, path: str, content: str) -> str:
        target = (SAFE_ROOT / path).resolve()
        if SAFE_ROOT not in target.parents and target != SAFE_ROOT:
            raise ToolError("path escape")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return str(target)


class FileRead(Tool):
    name = "file_read"

    async def __call__(self, path: str) -> str:
        target = (SAFE_ROOT / path).resolve()
        if SAFE_ROOT not in target.parents and target != SAFE_ROOT:
            raise ToolError("path escape")
        return target.read_text(encoding="utf-8")
