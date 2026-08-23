"""
Async Redis Session & Token Blacklist Provider
==============================================
Senior Design Note:
Provides an asynchronous in-memory dictionary-backed fallback for test suites and
standalone execution, with full Redis semantics (SETEX, GET, DELETE, SADD, SISMEMBER).
"""

import time
from typing import Dict, Set, Optional, Any


class AsyncRedisStore:
    def __init__(self):
        self._data: Dict[str, str] = {}
        self._expires: Dict[str, float] = {}
        self._sets: Dict[str, Set[str]] = {}

    async def get(self, key: str) -> Optional[str]:
        self._purge_expired(key)
        return self._data.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        self._data[key] = value
        if ex:
            self._expires[key] = time.time() + ex
        elif key in self._expires:
            del self._expires[key]

    async def delete(self, key: str) -> None:
        self._data.pop(key, None)
        self._expires.pop(key, None)
        self._sets.pop(key, None)

    async def sadd(self, key: str, member: str) -> None:
        if key not in self._sets:
            self._sets[key] = set()
        self._sets[key].add(member)

    async def sismember(self, key: str, member: str) -> bool:
        return member in self._sets.get(key, set())

    async def smembers(self, key: str) -> Set[str]:
        return set(self._sets.get(key, set()))

    def _purge_expired(self, key: str) -> None:
        if key in self._expires and time.time() > self._expires[key]:
            self._data.pop(key, None)
            self._expires.pop(key, None)
            self._sets.pop(key, None)


# Global singleton instance
redis_client = AsyncRedisStore()


async def get_redis_client() -> AsyncRedisStore:
    return redis_client
