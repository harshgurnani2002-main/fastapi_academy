"""
L1 In-Memory LRU Cache with TTL
================================
Senior Design Note:
Provides sub-microsecond in-process caching for hot items.
"""

import time
from collections import OrderedDict
from typing import Any, Optional, Tuple


class L1LRUCache:
    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None
        value, expires_at = self._cache[key]
        if time.time() > expires_at:
            del self._cache[key]
            return None
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return value

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (value, time.time() + ttl_seconds)
        if len(self._cache) > self.max_size:
            # Evict least recently used (first item)
            self._cache.popitem(last=False)

    def delete(self, key: str) -> None:
        self._cache.pop(key, None)

    def clear(self) -> None:
        self._cache.clear()
