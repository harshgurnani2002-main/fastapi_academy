from fastapi import APIRouter
from src.schemas.common import APIResponse

router = APIRouter(prefix="/tiers", tags=["Rate Limit Tiers"])

TIERS_CONFIG = {
    "anonymous": {"limit": 10, "window_seconds": 60, "algorithm": "sliding_window_log", "desc": "IP-based rate limiting"},
    "authenticated": {"limit": 60, "window_seconds": 60, "algorithm": "token_bucket", "desc": "User ID rate limiting with burst support"},
    "enterprise_api": {"limit": 600, "window_seconds": 60, "algorithm": "token_bucket", "desc": "High capacity M2M API key tier with 100 token burst"}
}


@router.get("/info", response_model=APIResponse[dict], summary="Get Available Rate Limit Tiers")
async def get_tiers():
    return APIResponse(data=TIERS_CONFIG)
