from fastapi import Depends
from src.core.redis_client import AsyncRedisEngine, get_redis
from src.services.cache_service import CacheService
from src.services.lock_service import LockService
from src.services.stream_service import StreamService


def get_cache_service(redis: AsyncRedisEngine = Depends(get_redis)) -> CacheService:
    return CacheService(redis)


def get_lock_service(redis: AsyncRedisEngine = Depends(get_redis)) -> LockService:
    return LockService(redis)


def get_stream_service(redis: AsyncRedisEngine = Depends(get_redis)) -> StreamService:
    return StreamService(redis)
