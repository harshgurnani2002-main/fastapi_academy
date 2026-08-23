from fastapi import APIRouter
from src.services.rate_limit_service import RateLimitService
from src.schemas.common import APIResponse
from src.schemas.rate_limit import RateLimitEvalRequest, RateLimitEvalResponse

router = APIRouter(prefix="/rate-limit", tags=["Rate Limit Evaluator"])


@router.post("/evaluate", response_model=APIResponse[RateLimitEvalResponse], summary="Evaluate Dynamic Rate Limit")
async def evaluate_limit(payload: RateLimitEvalRequest):
    service = RateLimitService()
    res = await service.check_limit(
        identifier=payload.identifier,
        algorithm=payload.algorithm,
        limit=payload.limit,
        window_seconds=payload.window_seconds,
        cost=payload.cost
    )
    return APIResponse(
        message="Request allowed" if res.is_allowed else "Rate limit exceeded (429)",
        data=RateLimitEvalResponse(
            identifier=payload.identifier,
            algorithm=res.algorithm,
            is_allowed=res.is_allowed,
            limit=res.limit,
            remaining=res.remaining,
            reset_epoch=res.reset_epoch,
            retry_after_seconds=res.retry_after_seconds
        )
    )
