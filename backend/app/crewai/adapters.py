from __future__ import annotations

import os
from typing import Iterable

from langchain_core.documents import Document
from langchain_ollama import ChatOllama, OllamaEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from langchain_community.vectorstores import Qdrant as LCQdrant


def llm_general() -> ChatOllama:
    """Return the general-purpose LLM used by most crew roles."""
    return ChatOllama(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        model=os.getenv("CREW7_MODEL_GENERAL", "llama3:instruct"),
        temperature=0.2,
        num_ctx=8192,
        streaming=True,
    )


def llm_code() -> ChatOllama:
    """Return the code-focused LLM for engineering roles."""
    return ChatOllama(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        model=os.getenv("CREW7_MODEL_CODE", "codellama:instruct"),
        temperature=0.1,
        num_ctx=8192,
        streaming=True,
    )


def embedder() -> OllamaEmbeddings:
    return OllamaEmbeddings(
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        model=os.getenv("CREW7_EMBED_MODEL", "nomic-embed-text"),
    )


def _ensure_collection(client: QdrantClient, name: str) -> None:
    try:
        client.get_collection(name)
    except Exception:
        client.recreate_collection(
            collection_name=name,
            vectors_config=qmodels.VectorParams(size=768, distance=qmodels.Distance.COSINE),
        )


def crew_vector_store(crew_id: str) -> LCQdrant:
    """Return the per-crew vector store, creating it if missing."""
    client = QdrantClient(
        url=os.getenv("QDRANT_URL", "http://localhost:6333"),
        api_key=os.getenv("QDRANT_API_KEY") or None,
    )
    coll = f"crew7_{crew_id}"
    _ensure_collection(client, coll)
    return LCQdrant(client=client, collection_name=coll, embeddings=embedder())


def upsert_memory(crew_id: str, texts: Iterable[str], metadatas: dict | None = None) -> None:
    if not texts:
        return
    store = crew_vector_store(crew_id)
    docs = [Document(page_content=text, metadata=metadatas or {}) for text in texts]
    store.add_documents(docs)


def recall_memory(crew_id: str, query: str, k: int = 5):
    store = crew_vector_store(crew_id)
    return store.similarity_search(query, k=k)
