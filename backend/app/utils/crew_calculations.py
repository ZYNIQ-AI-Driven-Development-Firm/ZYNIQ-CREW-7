"""
Utility functions for crew calculations

Shared utilities that don't depend on other services to avoid circular imports.
"""
from app.models.web3_metadata import RarityTier


# XP thresholds for each level (levels 1-10)
XP_LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000
]


def calculate_level(xp: int) -> int:
    """Calculate level from XP"""
    for level, threshold in enumerate(XP_LEVEL_THRESHOLDS, start=1):
        if xp < threshold:
            return max(1, level - 1)
    return len(XP_LEVEL_THRESHOLDS)


def calculate_xp_for_next_level(xp: int) -> int:
    """Calculate XP required for next level"""
    current_level = calculate_level(xp)
    if current_level >= len(XP_LEVEL_THRESHOLDS):
        return XP_LEVEL_THRESHOLDS[-1] + 10000  # Max level, return arbitrary value
    return XP_LEVEL_THRESHOLDS[current_level]


def calculate_rarity_tier(level: int, success_rate: float) -> RarityTier:
    """
    Calculate rarity tier based on level and success rate
    
    Tier Requirements:
    - Prime: Level 8+ AND 90%+ success rate
    - Elite: Level 5+ AND 80%+ success rate
    - Advanced: Level 3+ AND 70%+ success rate
    - Common: Everything else
    """
    if level >= 8 and success_rate >= 90:
        return RarityTier.PRIME
    elif level >= 5 and success_rate >= 80:
        return RarityTier.ELITE
    elif level >= 3 and success_rate >= 70:
        return RarityTier.ADVANCED
    else:
        return RarityTier.COMMON
