from src.core.redis_client import AsyncRedisEngine
from src.core.distributed_lock import DistributedLock
from src.core.exceptions import LockAcquisitionException
from src.schemas.lock import LockAcquireResponse


class LockService:
    def __init__(self, redis: AsyncRedisEngine):
        self.redis = redis

    async def acquire_lock(self, resource_id: str, ttl_seconds: int = 10) -> LockAcquireResponse:
        lock = DistributedLock(self.redis, resource_id, ttl_seconds=ttl_seconds, acquire_timeout=0.1)
        success = await lock.acquire()
        if not success:
            raise LockAcquisitionException(f"Resource '{resource_id}' is currently held by another worker.")

        return LockAcquireResponse(
            resource_id=resource_id,
            lock_key=lock.lock_key,
            token=lock.token,
            ttl_seconds=ttl_seconds,
            acquired=True
        )

    async def release_lock(self, resource_id: str, token: str) -> bool:
        from src.core.lua_scripts import LUA_RELEASE_LOCK
        lock_key = f"lock:{resource_id}"
        res = await self.redis.eval(LUA_RELEASE_LOCK, 1, lock_key, token)
        return bool(res == 1)
