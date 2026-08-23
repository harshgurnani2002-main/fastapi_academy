import time
from fastapi import APIRouter, Depends
from src.core.redis_client import AsyncRedisEngine, get_redis
from src.core.lua_scripts import LUA_SLIDING_WINDOW_RATE_LIMIT
from src.schemas.common import APIResponse
from src.schemas.rate_limit import RateLimitCheckRequest, RateLimitCheckResponse

router = APIRouter(prefix="/rate-limits", tags=["Sliding Window Rate Limiter"])


@router.post("/check", response_model=APIResponse[RateLimitCheckResponse], summary="Atomic Sorted Set Sliding Window Check")
async def check_rate_limit(
    payload: RateLimitCheckRequest,
    redis: AsyncRedisEngine = Depends(get_redis)
):
    key = f"rate_limit:{payload.identifier}"
    now_ms = time.time() * 1000.0

    res = await redis.eval(
        LUA_SLIDING_WINDOW_RATE_LIMIT,
        1,
        key,
        now_ms,
        payload.window_ms,
        payload.limit
    )

    allowed = bool(res[0] == 1)
    remaining = int(res[1])

    return APIResponse(
        message="Rate limit evaluated" if allowed else "Rate limit exceeded",
        data=RateLimitCheckResponse(
            identifier=payload.identifier,
            is_allowed=allowed,
            remaining_tokens=remaining,
            limit=payload.limit,
            window_ms=payload.window_ms
        )
    )
