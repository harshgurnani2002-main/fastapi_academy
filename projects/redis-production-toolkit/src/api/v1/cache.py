from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_cache_service
from src.services.cache_service import CacheService
from src.core.exceptions import NotFoundException
from src.schemas.common import APIResponse
from src.schemas.cache import CacheSetRequest, CacheEntryResponse, CacheStatsResponse

router = APIRouter(prefix="/cache", tags=["Redis Caching Engine"])


@router.post("", response_model=APIResponse[dict], status_code=status.HTTP_201_CREATED, summary="Set Cache Key with TTL")
async def set_cache(
    payload: CacheSetRequest,
    cache_service: CacheService = Depends(get_cache_service)
):
    await cache_service.set(payload.key, payload.value, ttl_seconds=payload.ttl_seconds)
    return APIResponse(message="Key cached successfully", data={"key": payload.key, "ttl_seconds": payload.ttl_seconds})


@router.get("/{key}", response_model=APIResponse[CacheEntryResponse], summary="Get Cache Key")
async def get_cache(
    key: str,
    cache_service: CacheService = Depends(get_cache_service)
):
    val = await cache_service.get(key)
    if val is None:
        raise NotFoundException("Cache", key)

    ttl = await cache_service.redis.ttl(key)
    return APIResponse(data=CacheEntryResponse(key=key, value=val, ttl_remaining=ttl))


@router.delete("/{key}", response_model=APIResponse[dict], summary="Evict Cache Key")
async def delete_cache(
    key: str,
    cache_service: CacheService = Depends(get_cache_service)
):
    deleted = await cache_service.delete(key)
    return APIResponse(message="Key evicted", data={"deleted_count": deleted})


@router.get("/stats/summary", response_model=APIResponse[CacheStatsResponse], summary="Cache Hit / Miss Metrics")
async def get_cache_stats(cache_service: CacheService = Depends(get_cache_service)):
    stats = await cache_service.get_stats()
    return APIResponse(data=stats)
