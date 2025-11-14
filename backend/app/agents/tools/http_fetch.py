from __future__ import annotations

import httpx

from .base import Tool, ToolError

ALLOWED_SCHEMES = {"http", "https"}
DEFAULT_TIMEOUT = 15.0


class HttpFetch(Tool):
    name = "http_fetch"

    async def __call__(
        self,
        url: str,
        method: str = "GET",
        headers: dict | None = None,
        data: str | None = None,
    ) -> str:
        if not any(url.startswith(f"{scheme}://") for scheme in ALLOWED_SCHEMES):
            raise ToolError("disallowed scheme")
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            response = await client.request(method, url, headers=headers, data=data)
            response.raise_for_status()
            text = response.text
            return text[:20000]
