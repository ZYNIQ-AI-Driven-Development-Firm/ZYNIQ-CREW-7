"""
Embedding Service - Generate vector embeddings for text content.

Uses Ollama embeddings model for semantic representation.
"""
from __future__ import annotations

import requests
from typing import List

from app.config import settings


def generate_embedding(text: str) -> list[float]:
    """
    Generate a vector embedding for the given text.
    
    Uses the configured embedding model (default: nomic-embed-text).
    Returns a 768-dimensional vector for semantic similarity search.
    """
    try:
        response = requests.post(
            f"{settings.OLLAMA_BASE_URL}/api/embeddings",
            json={
                "model": settings.MODEL_EMBED,
                "prompt": text,
            },
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()
        return result["embedding"]
    except Exception as e:
        # Fallback: return zero vector if embedding fails
        # In production, you might want to raise the error instead
        print(f"Warning: Failed to generate embedding: {e}")
        return [0.0] * 768


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts in batch.
    More efficient than calling generate_embedding multiple times.
    """
    embeddings = []
    for text in texts:
        embedding = generate_embedding(text)
        embeddings.append(embedding)
    return embeddings


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Calculate cosine similarity between two vectors.
    Returns a value between -1 and 1, where 1 means identical direction.
    """
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)
