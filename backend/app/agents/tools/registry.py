from __future__ import annotations

from typing import Any

from .files import FileRead, FileWrite
from .http_fetch import HttpFetch

REGISTRY = {
    "http_fetch": HttpFetch,
    "file_write": FileWrite,
    "file_read": FileRead,
}


def build_tools(allowlist: list[str] | None, config: dict[str, Any] | None) -> dict[str, Any]:
    allow = set(allowlist or [])
    cfg = config or {}
    tools: dict[str, Any] = {}
    for name in allow:
        cls = REGISTRY.get(name)
        if cls:
            tools[name] = cls(**cfg.get(name, {}))
    return tools
