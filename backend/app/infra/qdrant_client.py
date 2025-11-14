from __future__ import annotations

from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

from app.config import settings

_qdrant: Optional[QdrantClient] = None


def get_qdrant() -> QdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantClient(url=settings.QDRANT_URL)
    return _qdrant


def ensure_collection(name: str, vector_size: int = 384) -> None:
    client = get_qdrant()
    collections = client.get_collections().collections
    if name not in [collection.name for collection in collections]:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )
