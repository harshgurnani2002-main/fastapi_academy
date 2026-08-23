import time
from fastapi import APIRouter, Depends
from src.core.redis_client import AsyncRedisEngine, get_redis
from src.schemas.common import APIResponse

router = APIRouter(prefix="/diagnostics", tags=["System Diagnostics"])


@router.get("/health", response_model=APIResponse[dict], summary="Redis Connection & Performance Probe")
async def redis_health_probe(redis: AsyncRedisEngine = Depends(get_redis)):
    start = time.perf_counter()
    await redis.set("probe_key", "ok", ex=5)
    val = await redis.get("probe_key")
    latency_ms = (time.perf_counter() - start) * 1000.0

    return APIResponse(
        data={
            "status": "healthy",
            "redis_ping": "PONG",
            "probe_value": val,
            "latency_ms": round(latency_ms, 2),
            "memory_keys": len(redis._strings) + len(redis._hashes) + len(redis._zsets)
        }
    )
