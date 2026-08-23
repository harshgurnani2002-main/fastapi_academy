import asyncio
from fastapi import APIRouter
from src.services.rate_limit_service import RateLimitService
from src.schemas.common import APIResponse
from src.schemas.simulation import BurstSimulationRequest, BurstSimulationResult

router = APIRouter(prefix="/simulator", tags=["Burst Traffic Simulator"])


@router.post("/run-burst", response_model=APIResponse[BurstSimulationResult], summary="Simulate High-Concurrency Burst Traffic")
async def simulate_burst(payload: BurstSimulationRequest):
    service = RateLimitService()
    # Reset target key first
    service.redis.clear()

    accepted = 0
    rejected = 0
    max_retry_after = 0

    async def send_single_req():
        res = await service.check_limit(
            identifier=payload.identifier,
            algorithm=payload.algorithm,
            limit=payload.limit,
            window_seconds=payload.window_seconds
        )
        return res

    tasks = [send_single_req() for _ in range(payload.total_burst_requests)]
    results = await asyncio.gather(*tasks)

    for r in results:
        if r.is_allowed:
            accepted += 1
        else:
            rejected += 1
            max_retry_after = max(max_retry_after, r.retry_after_seconds)

    summary = (
        f"Under {payload.algorithm}, {accepted} requests were accepted (quota: {payload.limit}), "
        f"and {rejected} requests were rejected with 429 Too Many Requests."
    )

    return APIResponse(
        message="Burst simulation complete",
        data=BurstSimulationResult(
            algorithm=payload.algorithm,
            requests_sent=payload.total_burst_requests,
            accepted=accepted,
            rejected_429=rejected,
            rate_limit=payload.limit,
            retry_after_seconds=max_retry_after,
            summary=summary
        )
    )
