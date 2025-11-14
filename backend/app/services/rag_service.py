from __future__ import annotations

from typing import List, Tuple

from app.config import settings
from app.infra.ollama import get_ollama_client
from app.infra.qdrant_client import get_qdrant


async def rag_retrieve(collection: str, query: str, top_k: int = 5) -> List[Tuple[float, str]]:
    client = get_ollama_client()
    query_vector = await client.embed(settings.MODEL_EMBED, query)
    qdrant = get_qdrant()
    results = qdrant.search(collection_name=collection, query_vector=query_vector, limit=top_k)
    return [(match.score, (match.payload or {}).get("text", "")) for match in results]
