import time
from src.core.redis_engine import AsyncRateLimitRedisEngine
from src.core.lua_scripts import LUA_TOKEN_BUCKET
from src.core.rate_limiters.base import BaseRateLimiter, RateLimitResult


class TokenBucketRateLimiter(BaseRateLimiter):
    def __init__(self, redis: AsyncRateLimitRedisEngine):
        self.redis = redis

    async def evaluate(self, identifier: str, limit: int, window_seconds: int, cost: int = 1) -> RateLimitResult:
        key = f"rate_limit:token_bucket:{identifier}"
        capacity = float(limit)
        refill_rate = float(limit) / float(window_seconds)  # tokens per second
        now_ms = time.time() * 1000.0

        res = await self.redis.eval(
            LUA_TOKEN_BUCKET,
            1,
            key,
            capacity,
            refill_rate,
            float(cost),
            now_ms
        )

        allowed = bool(res[0] == 1)
        remaining = int(res[1])
        retry_after = int(res[2])
        reset_epoch = int(time.time()) + retry_after

        return RateLimitResult(
            is_allowed=allowed,
            limit=limit,
            remaining=remaining,
            reset_epoch=reset_epoch,
            retry_after_seconds=retry_after if not allowed else 0,
            algorithm="token_bucket"
        )
