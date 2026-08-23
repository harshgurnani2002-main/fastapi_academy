from fastapi import APIRouter
from src.services.caching_service import CachingService
from src.schemas.common import APIResponse
from src.schemas.cache_metrics import CacheTelemetryResponse

router = APIRouter(prefix="/metrics", tags=["Cache Telemetry & Performance"])


@router.get("/cache-telemetry", response_model=APIResponse[CacheTelemetryResponse], summary="Real-time Cache Hit Ratio & Performance")
async def get_telemetry():
    metrics = CachingService.get_telemetry()
    return APIResponse(data=metrics)
