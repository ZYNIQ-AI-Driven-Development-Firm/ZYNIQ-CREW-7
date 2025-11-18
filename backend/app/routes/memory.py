"""
Memory API - Vector memory operations for crews and missions.

Provides endpoints for:
- Adding memories to crew/mission vector stores
- Searching semantic memories
- Getting memory statistics
- Managing memory lifecycle
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.memory_service import (
    add_crew_memory,
    add_mission_memory,
    clear_crew_memory,
    clear_mission_memory,
    get_crew_memory_stats,
    search_crew_memory,
    search_mission_memory,
)
from app.services.embedding_service import generate_embedding, generate_embeddings_batch

router = APIRouter(prefix="/memory", tags=["memory"])


# ============================================================================
# Request/Response Models
# ============================================================================

class AddMemoryRequest(BaseModel):
    content: str = Field(..., description="Text content to store")
    embedding: list[float] = Field(..., description="Vector embedding of the content")
    metadata: dict[str, Any] | None = Field(None, description="Additional metadata")
    agent_role: str | None = Field(None, description="Role of agent that created this memory")


class AddCrewMemoryRequest(AddMemoryRequest):
    mission_id: str | None = Field(None, description="Optional mission this memory relates to")


class SearchMemoryRequest(BaseModel):
    query_embedding: list[float] = Field(..., description="Vector embedding of the search query")
    top_k: int = Field(5, ge=1, le=50, description="Number of results to return")
    agent_role: str | None = Field(None, description="Filter by agent role")


class SearchCrewMemoryRequest(SearchMemoryRequest):
    mission_id: str | None = Field(None, description="Filter by mission")


class MemoryResult(BaseModel):
    id: str
    content: str
    score: float
    agent_role: str | None
    timestamp: str
    metadata: dict[str, Any]


class CrewMemoryStats(BaseModel):
    crew_id: str
    total_memories: int
    recent_count: int
    collection_name: str


class MissionMemoryResult(MemoryResult):
    pass


class CrewMemoryResult(MemoryResult):
    mission_id: str | None


# ============================================================================
# Crew Memory Endpoints
# ============================================================================

@router.post("/crews/{crew_id}", response_model=dict[str, str])
async def add_crew_memory_endpoint(crew_id: str, request: AddCrewMemoryRequest):
    """
    Add a new memory to a crew's long-term vector store.
    
    Memories are stored with semantic embeddings for later retrieval.
    Use this to store:
    - Architecture decisions
    - API contracts
    - Previous mission outcomes
    - Team learnings
    """
    try:
        memory_id = add_crew_memory(
            crew_id=crew_id,
            content=request.content,
            embedding=request.embedding,
            metadata=request.metadata,
            mission_id=request.mission_id,
            agent_role=request.agent_role,
        )
        return {"memory_id": memory_id, "crew_id": crew_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add memory: {str(e)}")


@router.post("/crews/{crew_id}/search", response_model=list[CrewMemoryResult])
async def search_crew_memory_endpoint(crew_id: str, request: SearchCrewMemoryRequest):
    """
    Search a crew's memory for relevant past experiences.
    
    Use semantic similarity to find related memories.
    Great for:
    - Recalling similar past missions
    - Finding relevant architecture decisions
    - Discovering patterns across missions
    """
    try:
        results = search_crew_memory(
            crew_id=crew_id,
            query_embedding=request.query_embedding,
            top_k=request.top_k,
            mission_id=request.mission_id,
            agent_role=request.agent_role,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search memory: {str(e)}")


@router.get("/crews/{crew_id}/stats", response_model=CrewMemoryStats)
async def get_crew_memory_stats_endpoint(crew_id: str):
    """
    Get statistics about a crew's memory.
    
    Returns:
    - Total number of memories stored
    - Recent memory count (cached in Redis)
    - Collection name in Qdrant
    """
    try:
        stats = get_crew_memory_stats(crew_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.delete("/crews/{crew_id}")
async def clear_crew_memory_endpoint(crew_id: str):
    """
    Clear all memories for a crew.
    
    ⚠️ WARNING: This is permanent and cannot be undone!
    Use with caution - typically only for testing or crew reset.
    """
    try:
        clear_crew_memory(crew_id)
        return {"message": f"Cleared all memories for crew {crew_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear memory: {str(e)}")


# ============================================================================
# Mission Memory Endpoints
# ============================================================================

@router.post("/missions/{mission_id}", response_model=dict[str, str])
async def add_mission_memory_endpoint(mission_id: str, request: AddMemoryRequest):
    """
    Add a memory specific to a mission.
    
    Mission memories are more focused than crew-level memories.
    Use for:
    - Decisions made during this specific mission
    - Intermediate results and progress
    - Agent communications and handoffs
    """
    try:
        memory_id = add_mission_memory(
            mission_id=mission_id,
            content=request.content,
            embedding=request.embedding,
            metadata=request.metadata,
            agent_role=request.agent_role,
        )
        return {"memory_id": memory_id, "mission_id": mission_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add memory: {str(e)}")


@router.post("/missions/{mission_id}/search", response_model=list[MissionMemoryResult])
async def search_mission_memory_endpoint(mission_id: str, request: SearchMemoryRequest):
    """
    Search within a specific mission's memory.
    
    Useful for:
    - Finding what was decided earlier in the mission
    - Checking what a specific agent said
    - Reviewing progress chronologically
    """
    try:
        results = search_mission_memory(
            mission_id=mission_id,
            query_embedding=request.query_embedding,
            top_k=request.top_k,
            agent_role=request.agent_role,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search memory: {str(e)}")


@router.delete("/missions/{mission_id}")
async def clear_mission_memory_endpoint(mission_id: str):
    """
    Clear all memories for a specific mission.
    
    ⚠️ WARNING: This is permanent and cannot be undone!
    Typically used after mission completion or for cleanup.
    """
    try:
        clear_mission_memory(mission_id)
        return {"message": f"Cleared all memories for mission {mission_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear memory: {str(e)}")


# ============================================================================
# Batch Operations
# ============================================================================

@router.post("/crews/{crew_id}/batch", response_model=dict[str, Any])
async def add_crew_memories_batch(crew_id: str, memories: list[AddCrewMemoryRequest]):
    """
    Add multiple memories to a crew at once.
    
    Useful for:
    - Importing historical data
    - Bulk mission analysis
    - Training from past experiences
    """
    try:
        memory_ids = []
        for memory in memories:
            memory_id = add_crew_memory(
                crew_id=crew_id,
                content=memory.content,
                embedding=memory.embedding,
                metadata=memory.metadata,
                mission_id=memory.mission_id,
                agent_role=memory.agent_role,
            )
            memory_ids.append(memory_id)
        
        return {
            "crew_id": crew_id,
            "memories_added": len(memory_ids),
            "memory_ids": memory_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add batch memories: {str(e)}")


# ============================================================================
# Embedding Helper Endpoints
# ============================================================================

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text to generate embedding for")


class EmbeddingBatchRequest(BaseModel):
    texts: list[str] = Field(..., description="List of texts to generate embeddings for")


@router.post("/embed", response_model=dict[str, Any])
async def generate_embedding_endpoint(request: EmbeddingRequest):
    """
    Generate a vector embedding for text.
    
    Useful when you want to:
    - Add a memory but don't have the embedding yet
    - Search memory with a text query
    - Compare semantic similarity
    """
    try:
        embedding = generate_embedding(request.text)
        return {
            "text": request.text,
            "embedding": embedding,
            "dimension": len(embedding)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@router.post("/embed/batch", response_model=dict[str, Any])
async def generate_embeddings_batch_endpoint(request: EmbeddingBatchRequest):
    """
    Generate embeddings for multiple texts in batch.
    More efficient than calling /embed multiple times.
    """
    try:
        embeddings = generate_embeddings_batch(request.texts)
        return {
            "count": len(embeddings),
            "embeddings": embeddings,
            "dimension": len(embeddings[0]) if embeddings else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")
