"""
Distributed Mutex Lock (SET NX EX + Atomic Lua Release)
=======================================================
Senior Design Note:
Implements correct distributed mutual exclusion:
1. `acquire()`: Uses `SET lock_key uuid NX EX ttl`.
2. `release()`: Executes `LUA_RELEASE_LOCK` ensuring ONLY the lock holder can delete the key.
3. Automatically avoids releasing locks that expired and were acquired by another worker.
"""

import uuid
import asyncio
import time
from typing import Optional
from src.core.redis_client import AsyncRedisEngine
from src.core.lua_scripts import LUA_RELEASE_LOCK
from src.core.exceptions import LockAcquisitionException


class DistributedLock:
    def __init__(
        self,
        redis: AsyncRedisEngine,
        resource_name: str,
        ttl_seconds: int = 10,
        acquire_timeout: float = 3.0,
        retry_interval: float = 0.05
    ):
        self.redis = redis
        self.resource_name = resource_name
        self.lock_key = f"lock:{resource_name}"
        self.token = str(uuid.uuid4())
        self.ttl_seconds = ttl_seconds
        self.acquire_timeout = acquire_timeout
        self.retry_interval = retry_interval
        self._acquired = False

    async def acquire(self) -> bool:
        start = time.perf_counter()
        while time.perf_counter() - start < self.acquire_timeout:
            acquired = await self.redis.set(self.lock_key, self.token, ex=self.ttl_seconds, nx=True)
            if acquired:
                self._acquired = True
                return True
            await asyncio.sleep(self.retry_interval)
        return False

    async def release(self) -> bool:
        if not self._acquired:
            return False
        res = await self.redis.eval(LUA_RELEASE_LOCK, 1, self.lock_key, self.token)
        self._acquired = False
        return bool(res == 1)

    async def __aenter__(self):
        success = await self.acquire()
        if not success:
            raise LockAcquisitionException(f"Could not acquire distributed lock on '{self.resource_name}' within {self.acquire_timeout}s.")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.release()
