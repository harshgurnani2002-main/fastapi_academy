import time
from src.core.redis_engine import AsyncRateLimitRedisEngine
from src.core.rate_limiters.base import BaseRateLimiter, RateLimitResult


class FixedWindowRateLimiter(BaseRateLimiter):
    def __init__(self, redis: AsyncRateLimitRedisEngine):
        self.redis = redis

    async def evaluate(self, identifier: str, limit: int, window_seconds: int, cost: int = 1) -> RateLimitResult:
        current_window = int(time.time() // window_seconds)
        key = f"rate_limit:fixed:{identifier}:{current_window}"

        count = await self.redis.incr(key)
        if count == 1:
            await self.redis.expire(key, window_seconds + 1)

        allowed = count <= limit
        remaining = max(0, limit - count)
        reset_epoch = (current_window + 1) * window_seconds
        retry_after = max(1, reset_epoch - int(time.time()))

        return RateLimitResult(
            is_allowed=allowed,
            limit=limit,
            remaining=remaining,
            reset_epoch=reset_epoch,
            retry_after_seconds=retry_after if not allowed else 0,
            algorithm="fixed_window"
        )
