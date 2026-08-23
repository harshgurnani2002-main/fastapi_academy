from src.core.redis_engine import AsyncRateLimitRedisEngine, redis_engine
from src.core.rate_limiters.sliding_window import SlidingWindowRateLimiter
from src.core.rate_limiters.token_bucket import TokenBucketRateLimiter
from src.core.rate_limiters.fixed_window import FixedWindowRateLimiter
from src.core.rate_limiters.base import RateLimitResult


class RateLimitService:
    def __init__(self, redis: AsyncRateLimitRedisEngine = redis_engine):
        self.redis = redis
        self.sliding = SlidingWindowRateLimiter(redis)
        self.token_bucket = TokenBucketRateLimiter(redis)
        self.fixed = FixedWindowRateLimiter(redis)

    async def check_limit(
        self,
        identifier: str,
        algorithm: str = "sliding_window",
        limit: int = 10,
        window_seconds: int = 60,
        cost: int = 1
    ) -> RateLimitResult:
        if algorithm == "token_bucket":
            return await self.token_bucket.evaluate(identifier, limit, window_seconds, cost)
        elif algorithm == "fixed_window":
            return await self.fixed.evaluate(identifier, limit, window_seconds, cost)
        else:
            return await self.sliding.evaluate(identifier, limit, window_seconds, cost)
