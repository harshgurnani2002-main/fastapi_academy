"""
Request Coalescing / Single-Flight Barrier
==========================================
Senior Design Note:
Collapses multiple concurrent requests for the same uncached key into a single
backend database execution. When 50 callers ask for product:101 at the same millisecond,
only 1 database query executes. All 50 callers await the same in-flight Future.
"""

import asyncio
from typing import Dict, Any, Callable, Awaitable, TypeVar

T = TypeVar("T")


class SingleFlightGroup:
    def __init__(self):
        self._in_flight: Dict[str, asyncio.Future] = {}
        self._lock = asyncio.Lock()

    async def do(self, key: str, fn: Callable[[], Awaitable[T]]) -> T:
        async with self._lock:
            if key in self._in_flight:
                # Another worker is already computing this key; join the flight
                fut = self._in_flight[key]
                # Release lock while waiting
                is_leader = False
            else:
                fut = asyncio.get_event_loop().create_future()
                self._in_flight[key] = fut
                is_leader = True

        if not is_leader:
            return await fut

        # Leader executes the actual backend query
        try:
            result = await fn()
            fut.set_result(result)
            return result
        except Exception as e:
            fut.set_exception(e)
            raise
        finally:
            async with self._lock:
                self._in_flight.pop(key, None)
