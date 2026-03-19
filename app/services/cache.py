"""Redis caching for analysis responses."""

import json
from typing import Any

from redis.asyncio import Redis

ANALYSIS_KEY_PREFIX = "analysis:"
ANALYSIS_TTL = 3600


async def get_cached_analysis(redis: Redis | None, statement_id: int) -> dict | None:
    """Return cached analysis for statement_id or None if miss."""
    if not redis:
        return None
    key = f"{ANALYSIS_KEY_PREFIX}{statement_id}"
    raw = await redis.get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def set_cached_analysis(
    redis: Redis | None,
    statement_id: int,
    data: dict[str, Any],
    ttl: int = ANALYSIS_TTL,
) -> None:
    """Cache analysis for statement_id with given TTL."""
    if not redis:
        return
    key = f"{ANALYSIS_KEY_PREFIX}{statement_id}"
    await redis.setex(key, ttl, json.dumps(data))
