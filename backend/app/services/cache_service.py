"""
Cache service for metadata and other frequently accessed data.

Provides Redis-based caching with automatic serialization and TTL management.
"""
from __future__ import annotations

import json
from typing import Any, TypeVar

from app.infra.redis import get_redis

T = TypeVar("T")

# Cache TTLs (in seconds)
METADATA_TTL = 300  # 5 minutes for crew/agent metadata
POPULAR_CREWS_TTL = 600  # 10 minutes for popular crews list
STATS_TTL = 180  # 3 minutes for stats/leaderboards


class CacheService:
    """Service for managing Redis cache operations."""

    def __init__(self):
        self._redis = get_redis()

    # ==================== Generic Cache Operations ====================

    def get(self, key: str) -> Any | None:
        """
        Get a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value (deserialized from JSON) or None if not found
        """
        try:
            value = self._redis.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception as e:
            # Log error but don't break the application
            print(f"Cache get error for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int) -> bool:
        """
        Set a value in cache with TTL.

        Args:
            key: Cache key
            value: Value to cache (will be serialized to JSON)
            ttl: Time to live in seconds

        Returns:
            True if successful, False otherwise
        """
        try:
            serialized = json.dumps(value)
            self._redis.setex(key, ttl, serialized)
            return True
        except Exception as e:
            print(f"Cache set error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """
        Delete a value from cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted, False if key didn't exist or error
        """
        try:
            result = self._redis.delete(key)
            return result > 0
        except Exception as e:
            print(f"Cache delete error for key {key}: {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern.

        Args:
            pattern: Redis pattern (e.g., "crew:*:metadata")

        Returns:
            Number of keys deleted
        """
        try:
            keys = self._redis.keys(pattern)
            if not keys:
                return 0
            return self._redis.delete(*keys)
        except Exception as e:
            print(f"Cache delete_pattern error for pattern {pattern}: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        try:
            return self._redis.exists(key) > 0
        except Exception as e:
            print(f"Cache exists error for key {key}: {e}")
            return False

    # ==================== Metadata-Specific Operations ====================

    def get_crew_metadata(self, crew_id: int) -> dict | None:
        """Get cached crew NFT metadata."""
        key = f"metadata:crew:{crew_id}"
        return self.get(key)

    def set_crew_metadata(self, crew_id: int, metadata: dict) -> bool:
        """Cache crew NFT metadata for 5 minutes."""
        key = f"metadata:crew:{crew_id}"
        return self.set(key, metadata, METADATA_TTL)

    def invalidate_crew_metadata(self, crew_id: int) -> bool:
        """Invalidate cached crew metadata (call when crew is updated)."""
        key = f"metadata:crew:{crew_id}"
        return self.delete(key)

    def get_agent_metadata(self, agent_id: int) -> dict | None:
        """Get cached agent NFT metadata."""
        key = f"metadata:agent:{agent_id}"
        return self.get(key)

    def set_agent_metadata(self, agent_id: int, metadata: dict) -> bool:
        """Cache agent NFT metadata for 5 minutes."""
        key = f"metadata:agent:{agent_id}"
        return self.set(key, metadata, METADATA_TTL)

    def invalidate_agent_metadata(self, agent_id: int) -> bool:
        """Invalidate cached agent metadata (call when agent is updated)."""
        key = f"metadata:agent:{agent_id}"
        return self.delete(key)

    def get_crew_agents_metadata(self, crew_id: int) -> list | None:
        """Get cached list of agent metadata for a crew."""
        key = f"metadata:crew:{crew_id}:agents"
        return self.get(key)

    def set_crew_agents_metadata(self, crew_id: int, agents: list) -> bool:
        """Cache list of agent metadata for a crew."""
        key = f"metadata:crew:{crew_id}:agents"
        return self.set(key, agents, METADATA_TTL)

    def invalidate_crew_agents_metadata(self, crew_id: int) -> bool:
        """Invalidate cached crew agents list."""
        key = f"metadata:crew:{crew_id}:agents"
        return self.delete(key)

    # ==================== Bulk Invalidation ====================

    def invalidate_all_crew_metadata(self, crew_id: int) -> int:
        """
        Invalidate all metadata related to a crew.

        Useful when crew is updated/deleted - clears crew metadata + agents list.

        Returns:
            Number of keys invalidated
        """
        pattern = f"metadata:crew:{crew_id}*"
        return self.delete_pattern(pattern)

    def invalidate_all_metadata(self) -> int:
        """
        Invalidate ALL cached metadata (nuclear option).

        Use sparingly - typically only for major system updates.

        Returns:
            Number of keys invalidated
        """
        return self.delete_pattern("metadata:*")

    # ==================== Stats & Leaderboards ====================

    def get_popular_crews(self) -> list | None:
        """Get cached list of popular crews (for homepage)."""
        return self.get("stats:popular_crews")

    def set_popular_crews(self, crews: list) -> bool:
        """Cache popular crews list for 10 minutes."""
        return self.set("stats:popular_crews", crews, POPULAR_CREWS_TTL)

    def get_leaderboard(self, leaderboard_type: str) -> list | None:
        """Get cached leaderboard (e.g., 'top_performers', 'most_missions')."""
        key = f"stats:leaderboard:{leaderboard_type}"
        return self.get(key)

    def set_leaderboard(self, leaderboard_type: str, data: list) -> bool:
        """Cache leaderboard for 3 minutes."""
        key = f"stats:leaderboard:{leaderboard_type}"
        return self.set(key, data, STATS_TTL)

    # ==================== Pricing Cache ====================

    def get_crew_pricing(self, crew_id: int) -> dict | None:
        """Get cached crew pricing breakdown."""
        key = f"pricing:crew:{crew_id}"
        return self.get(key)

    def set_crew_pricing(self, crew_id: int, pricing_data: dict) -> bool:
        """Cache crew pricing breakdown for 5 minutes."""
        key = f"pricing:crew:{crew_id}"
        return self.set(key, pricing_data, METADATA_TTL)

    def invalidate_crew_pricing(self, crew_id: int) -> bool:
        """Invalidate cached crew pricing (call when factors change)."""
        key = f"pricing:crew:{crew_id}"
        return self.delete(key)


# Singleton instance
_cache_service: CacheService | None = None


def get_cache_service() -> CacheService:
    """Get or create the cache service singleton."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
