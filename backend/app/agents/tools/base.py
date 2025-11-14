from __future__ import annotations

from typing import Any


class ToolError(Exception):
    """Raised when a tool invocation fails guardrails."""


class Tool:
    name: str = "tool"

    def __init__(self, **cfg: Any) -> None:
        self.cfg = cfg

    async def __call__(self, **kwargs: Any) -> Any:  # pragma: no cover - interface method
        raise NotImplementedError
