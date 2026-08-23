"""
In-Memory Sliding Window Rate Limiter
=====================================
Senior Design Note:
Protects against brute force and resource exhaustion DoS (OWASP API4:2023).
Tracks request timestamps per client IP.
"""

import time
from collections import defaultdict
from typing import Dict, List


class SlidingWindowRateLimiter:
    def __init__(self):
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        now = time.time()
        window_start = now - window_seconds
        
        # Purge timestamps outside the sliding window
        self._requests[client_ip] = [t for t in self._requests[client_ip] if t > window_start]

        if len(self._requests[client_ip]) >= max_requests:
            return False

        self._requests[client_ip].append(now)
        return True

    def reset(self) -> None:
        self._requests.clear()


rate_limiter = SlidingWindowRateLimiter()
