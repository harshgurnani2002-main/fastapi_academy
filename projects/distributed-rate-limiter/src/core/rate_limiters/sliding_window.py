import time
from src.core.redis_engine import AsyncRateLimitRedisEngine
from src.core.lua_scripts import LUA_SLIDING_WINDOW
from src.core.rate_limiters.base import BaseRateLimiter, RateLimitResult


class SlidingWindowRateLimiter(BaseRateLimiter):
    def __init__(self, redis: AsyncRateLimitRedisEngine):
        self.redis = redis

    async def evaluate(self, identifier: str, limit: int, window_seconds: int, cost: int = 1) -> RateLimitResult:
        key = f"rate_limit:sliding:{identifier}"
        now_ms = time.time() * 1000.0
        window_ms = window_seconds * 1000.0

        res = await self.redis.eval(
            LUA_SLIDING_WINDOW,
            1,
            key,
            now_ms,
            window_ms,
            limit
        )

        allowed = bool(res[0] == 1)
        remaining = int(res[1])
        retry_after = int(res[2])
        reset_epoch = int(time.time()) + (retry_after if not allowed else window_seconds)

        return RateLimitResult(
            is_allowed=allowed,
            limit=limit,
            remaining=remaining,
            reset_epoch=reset_epoch,
            retry_after_seconds=retry_after if not allowed else 0,
            algorithm="sliding_window_log"
        )
