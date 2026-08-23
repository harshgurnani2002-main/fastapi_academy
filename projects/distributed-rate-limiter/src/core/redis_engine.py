"""
Async Redis Engine & In-Memory Rate Limit Emulator
==================================================
"""

import time
import math
from typing import Dict, List, Tuple, Any, Optional
from collections import defaultdict


class AsyncRateLimitRedisEngine:
    def __init__(self):
        self._strings: Dict[str, str] = {}
        self._hashes: Dict[str, Dict[str, str]] = defaultdict(dict)
        self._zsets: Dict[str, List[Tuple[float, str]]] = defaultdict(list)
        self._expires: Dict[str, float] = {}

    def _purge_key(self, key: str) -> None:
        if key in self._expires and time.time() > self._expires[key]:
            self._strings.pop(key, None)
            self._hashes.pop(key, None)
            self._zsets.pop(key, None)
            self._expires.pop(key, None)

    async def get(self, key: str) -> Optional[str]:
        self._purge_key(key)
        return self._strings.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        self._strings[key] = str(value)
        if ex:
            self._expires[key] = time.time() + ex
        return True

    async def incr(self, key: str) -> int:
        self._purge_key(key)
        val = int(self._strings.get(key, 0)) + 1
        self._strings[key] = str(val)
        return val

    async def expire(self, key: str, seconds: int) -> bool:
        self._expires[key] = time.time() + seconds
        return True

    async def eval(self, script: str, numkeys: int, *keys_and_args: Any) -> Any:
        keys = keys_and_args[:numkeys]
        args = keys_and_args[numkeys:]

        # 1. Sliding Window Log Emulation
        if "zremrangebyscore" in script:
            key = keys[0]
            now = float(args[0])
            window = float(args[1])
            limit = int(args[2])
            clear_before = now - window

            self._zsets[key] = [(score, member) for score, member in self._zsets[key] if score > clear_before]
            curr = len(self._zsets[key])
            if curr < limit:
                self._zsets[key].append((now, str(now)))
                await self.expire(key, int(window / 1000) + 1)
                return [1, limit - curr - 1, math.ceil(window / 1000)]
            else:
                oldest_score = self._zsets[key][0][0] if self._zsets[key] else now
                retry_after = max(1, math.ceil((oldest_score + window - now) / 1000))
                return [0, 0, retry_after]

        # 2. Token Bucket Emulation
        if "hmget" in script and "refill_rate" in script:
            key = keys[0]
            capacity = float(args[0])
            refill_rate = float(args[1])
            cost = float(args[2])
            now = float(args[3])

            data = self._hashes[key]
            tokens = float(data.get("tokens", capacity))
            last_refill = float(data.get("last_refill", now))

            elapsed = max(0.0, (now - last_refill) / 1000.0)
            tokens = min(capacity, tokens + (elapsed * refill_rate))
            last_refill = now

            if tokens >= cost:
                tokens -= cost
                self._hashes[key]["tokens"] = str(tokens)
                self._hashes[key]["last_refill"] = str(last_refill)
                await self.expire(key, int(capacity / refill_rate) * 2 + 1)
                return [1, math.floor(tokens), 0]
            else:
                needed = cost - tokens
                retry_after = max(1, math.ceil(needed / refill_rate))
                self._hashes[key]["tokens"] = str(tokens)
                self._hashes[key]["last_refill"] = str(last_refill)
                return [0, 0, retry_after]

        return [1, 0, 0]

    def clear(self) -> None:
        self._strings.clear()
        self._hashes.clear()
        self._zsets.clear()
        self._expires.clear()


redis_engine = AsyncRateLimitRedisEngine()


async def get_redis() -> AsyncRateLimitRedisEngine:
    return redis_engine
