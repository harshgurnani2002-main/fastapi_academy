"""
Three-State Circuit Breaker & Bulkhead Semaphore
=================================================
States: CLOSED (healthy) -> OPEN (tripped after N failures) -> HALF_OPEN (probe request test)
"""

import time
import asyncio
from enum import Enum
from typing import Callable, Awaitable, Any


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout_sec: float = 0.2):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = time.time()

    async def call(self, fn: Callable[[], Awaitable[Any]]) -> Any:
        now = time.time()
        if self.state == CircuitState.OPEN:
            if now - self.last_state_change > self.recovery_timeout_sec:
                self.state = CircuitState.HALF_OPEN
                self.last_state_change = now
            else:
                raise RuntimeError("Circuit breaker is OPEN. Downstream dependency unavailable.")

        try:
            result = await fn()
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
            return result
        except Exception:
            self.failure_count += 1
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                self.last_state_change = time.time()
            raise


cb = CircuitBreaker()
