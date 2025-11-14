from __future__ import annotations

import json
from functools import lru_cache
from typing import AsyncIterator, List

import httpx

from app.config import settings


class OllamaClient:
    def __init__(self, base_url: str) -> None:
        self._base = base_url.rstrip("/")

    async def stream_generate(self, model: str, prompt: str, **kwargs) -> AsyncIterator[dict]:
        url = f"{self._base}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": True, **kwargs}
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=payload) as response:
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        yield json.loads(line)
                    except json.JSONDecodeError:
                        continue

    async def embed(self, model: str, text: str) -> List[float]:
        url = f"{self._base}/api/embeddings"
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, json={"model": model, "prompt": text})
            response.raise_for_status()
            data = response.json()
            return data["embedding"]


@lru_cache
def get_ollama_client() -> OllamaClient:
    return OllamaClient(settings.OLLAMA_BASE_URL)
