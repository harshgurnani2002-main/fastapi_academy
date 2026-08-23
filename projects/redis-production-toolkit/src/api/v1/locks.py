import asyncio
from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_lock_service, get_redis
from src.core.redis_client import AsyncRedisEngine
from src.core.distributed_lock import DistributedLock
from src.services.lock_service import LockService
from src.schemas.common import APIResponse
from src.schemas.lock import LockAcquireRequest, LockAcquireResponse, LockReleaseRequest, CriticalWorkRequest

router = APIRouter(prefix="/locks", tags=["Distributed Locking"])


@router.post("/acquire", response_model=APIResponse[LockAcquireResponse], status_code=status.HTTP_200_OK, summary="Acquire Distributed Mutex")
async def acquire_lock(
    payload: LockAcquireRequest,
    lock_service: LockService = Depends(get_lock_service)
):
    res = await lock_service.acquire_lock(payload.resource_id, ttl_seconds=payload.ttl_seconds)
    return APIResponse(message="Distributed lock acquired", data=res)


@router.post("/release", response_model=APIResponse[dict], summary="Atomic Lua Lock Release")
async def release_lock(
    payload: LockReleaseRequest,
    lock_service: LockService = Depends(get_lock_service)
):
    released = await lock_service.release_lock(payload.resource_id, payload.token)
    return APIResponse(data={"released": released, "resource_id": payload.resource_id})


@router.post("/critical-section", response_model=APIResponse[dict], summary="Execute Critical Section with Context Manager")
async def execute_critical_section(
    payload: CriticalWorkRequest,
    redis: AsyncRedisEngine = Depends(get_redis)
):
    async with DistributedLock(redis, payload.resource_id, ttl_seconds=5) as lock:
        # Simulate processing shared critical work
        await asyncio.sleep(payload.duration_ms / 1000.0)
        return APIResponse(message="Critical section completed safely under lock", data={"resource_id": payload.resource_id, "token": lock.token})
