"""Tool execution event emitter for real-time WebSocket updates."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Optional

from app.infra.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class ToolEventEmitter:
    """Emits tool execution events to Redis channels for WebSocket consumption."""
    
    def __init__(self, crew_id: str, run_id: Optional[str] = None, agent_id: Optional[str] = None):
        self.crew_id = crew_id
        self.run_id = run_id
        self.agent_id = agent_id
        self.redis = get_redis_client()
    
    def _publish(self, event: dict[str, Any]) -> None:
        """Publish event to both graph and mission channels."""
        try:
            # Publish to graph channel for AgentGraph visualization
            graph_channel = f"graph:{self.crew_id}"
            self.redis.publish(graph_channel, json.dumps(event))
            
            # Also publish to mission channel if we have run context
            if self.run_id:
                mission_channel = f"mission:{self.crew_id}"
                self.redis.publish(mission_channel, json.dumps(event))
            
            logger.debug(f"Tool event published: {event.get('type')} for crew={self.crew_id}")
        except Exception as exc:
            logger.error(f"Failed to publish tool event: {exc}")
    
    def emit_tool_start(self, tool_name: str, params: dict[str, Any]) -> None:
        """Emit tool_start event when tool execution begins."""
        event = {
            "type": "tool_start",
            "timestamp": datetime.utcnow().isoformat(),
            "crew_id": self.crew_id,
            "run_id": self.run_id,
            "agent_id": self.agent_id,
            "tool": tool_name,
            "params": params,
        }
        self._publish(event)
    
    def emit_tool_end(
        self,
        tool_name: str,
        duration_s: float,
        exit_code: Optional[int] = None,
        status: str = "success",
        error: Optional[str] = None,
    ) -> None:
        """Emit tool_end event when tool execution completes."""
        event = {
            "type": "tool_end",
            "timestamp": datetime.utcnow().isoformat(),
            "crew_id": self.crew_id,
            "run_id": self.run_id,
            "agent_id": self.agent_id,
            "tool": tool_name,
            "duration_s": round(duration_s, 3),
            "exit_code": exit_code,
            "status": status,
        }
        if error:
            event["error"] = error
        self._publish(event)
    
    def emit_tool_progress(self, tool_name: str, message: str, progress: Optional[float] = None) -> None:
        """Emit tool_progress event for long-running tools."""
        event = {
            "type": "tool_progress",
            "timestamp": datetime.utcnow().isoformat(),
            "crew_id": self.crew_id,
            "run_id": self.run_id,
            "agent_id": self.agent_id,
            "tool": tool_name,
            "message": message,
        }
        if progress is not None:
            event["progress"] = progress
        self._publish(event)
