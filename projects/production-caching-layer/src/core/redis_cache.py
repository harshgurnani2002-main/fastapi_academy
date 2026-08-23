"""
L2 Distributed Cache Layer with TTL Jitter
==========================================
Senior Design Note:
Prevents Cache Avalanche by injecting randomized jitter into expiration timers:
  actual_ttl = base_ttl * (1.0 + random.uniform(-jitter, jitter))
"""

import time
import json
import random
from typing import Any, Optional, Dict


def apply_jitter(base_ttl: int, jitter_pct: float = 0.15) -> int:
    variation = random.uniform(-jitter_pct, jitter_pct)
    return max(1, int(base_ttl * (1.0 + variation)))


class AsyncRedisL2Store:
    def __init__(self):
        self._data: Dict[str, str] = {}
        self._meta: Dict[str, Dict[str, Any]] = {}  # cached_at, ttl
        self._expires: Dict[str, float] = {}

    async def get(self, key: str) -> Optional[Any]:
        self._purge_if_expired(key)
        val_str = self._data.get(key)
        if val_str is None:
            return None
        try:
            return json.loads(val_str)
        except Exception:
            return val_str

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        jittered_ttl = apply_jitter(ttl_seconds)
        self._data[key] = json.dumps(value) if not isinstance(value, str) else value
        self._expires[key] = time.time() + jittered_ttl
        self._meta[key] = {"cached_at": time.time(), "ttl": jittered_ttl}

    async def delete(self, key: str) -> None:
        self._data.pop(key, None)
        self._expires.pop(key, None)
        self._meta.pop(key, None)

    def get_metadata(self, key: str) -> Optional[Dict[str, Any]]:
        self._purge_if_expired(key)
        return self._meta.get(key)

    def _purge_if_expired(self, key: str) -> None:
        if key in self._expires and time.time() > self._expires[key]:
            self._data.pop(key, None)
            self._expires.pop(key, None)
            self._meta.pop(key, None)

    def clear(self) -> None:
        self._data.clear()
        self._expires.clear()
        self._meta.clear()


redis_l2 = AsyncRedisL2Store()
