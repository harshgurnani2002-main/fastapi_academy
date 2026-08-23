"""
Cache-Aside Pattern with Single-Flight Stampede Defense
=======================================================
Senior Design Note:
Mitigates Cache Stampede (Dogpile Effect):
When a hot key expires and 100 concurrent requests arrive, `get_or_compute` acquires
a distributed lock for the key. Exactly 1 request recomputes the expensive database value,
while the other 99 wait on the lock and then read the freshly populated cache!
"""

import json
import asyncio
from typing import Any, Optional, Callable, Awaitable
from src.core.redis_client import AsyncRedisEngine
from src.core.distributed_lock import DistributedLock
from src.schemas.cache import CacheStatsResponse


class CacheService:
    def __init__(self, redis: AsyncRedisEngine):
        self.redis = redis

    async def get(self, key: str) -> Optional[Any]:
        val = await self.redis.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except Exception:
            return val

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        serialized = json.dumps(value) if not isinstance(value, str) else value
        return await self.redis.set(key, serialized, ex=ttl_seconds)

    async def delete(self, key: str) -> int:
        return await self.redis.delete(key)

    async def get_or_compute_stampede_protected(
        self,
        key: str,
        compute_fn: Callable[[], Awaitable[Any]],
        ttl_seconds: int = 300
    ) -> Any:
        """Single-flight cache-aside with mutex locking."""
        # 1. Fast Cache Read
        cached = await self.get(key)
        if cached is not None:
            return cached

        # 2. Acquire Mutex Lock for Computation
        lock = DistributedLock(self.redis, f"compute:{key}", ttl_seconds=5, acquire_timeout=2.0)
        try:
            async with lock:
                # Double-check cache after acquiring lock
                cached_after_lock = await self.get(key)
                if cached_after_lock is not None:
                    return cached_after_lock

                # 3. Compute Value (Only 1 worker runs this!)
                fresh_value = await compute_fn()
                await self.set(key, fresh_value, ttl_seconds=ttl_seconds)
                return fresh_value
        except Exception:
            # Fallback: compute directly if lock fails
            fresh_value = await compute_fn()
            await self.set(key, fresh_value, ttl_seconds=ttl_seconds)
            return fresh_value

    async def get_stats(self) -> CacheStatsResponse:
        hits = self.redis.stats_hits
        misses = self.redis.stats_misses
        total = hits + misses
        ratio = round((hits / total) * 100.0, 2) if total > 0 else 0.0
        return CacheStatsResponse(
            hits=hits,
            misses=misses,
            hit_ratio=ratio,
            total_keys=len(self.redis._strings)
        )
