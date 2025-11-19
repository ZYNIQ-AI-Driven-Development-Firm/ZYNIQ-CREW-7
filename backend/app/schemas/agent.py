"""
Agent Schemas

Pydantic models for agent requests and responses.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
import json


class AgentBase(BaseModel):
    """Base agent fields."""
    role: str = Field(..., description="Agent role (orchestrator, researcher, writer, etc.)")
    name: str = Field(..., description="Agent name")
    description: Optional[str] = Field(None, description="Agent description")
    specialist_type: Optional[str] = Field(None, description="Specific expertise area")
    backstory: Optional[str] = Field(None, description="Agent backstory")
    goal: Optional[str] = Field(None, description="Agent goal")
    llm_config: Optional[str | dict[str, Any]] = Field(None, description="LLM configuration JSON or dict")
    tools_list: Optional[str] = Field(None, description="Comma-separated tool names")
    
    @field_validator('llm_config', mode='before')
    @classmethod
    def validate_llm_config(cls, v):
        """Convert dict to JSON string if needed."""
        if isinstance(v, dict):
            return json.dumps(v)
        return v


class AgentCreate(AgentBase):
    """Request to create a new agent."""
    crew_id: UUID = Field(..., description="ID of the crew this agent belongs to")


class AgentPatch(BaseModel):
    """Request to update an agent."""
    role: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    specialist_type: Optional[str] = None
    backstory: Optional[str] = None
    goal: Optional[str] = None
    llm_config: Optional[str | dict[str, Any]] = None
    tools_list: Optional[str] = None
    
    @field_validator('llm_config', mode='before')
    @classmethod
    def validate_llm_config(cls, v):
        """Convert dict to JSON string if needed."""
        if isinstance(v, dict):
            return json.dumps(v)
        return v


class AgentOut(AgentBase):
    """Agent response."""
    id: UUID
    crew_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentWithCrewName(AgentOut):
    """Agent with crew name (for listings)."""
    crew_name: str
