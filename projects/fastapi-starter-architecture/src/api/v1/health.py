import time
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from src.core.config import get_settings
from src.db.session import get_db
from src.schemas.health import HealthCheckResponse, ReadinessResponse

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])
settings = get_settings()


@router.get("", response_model=HealthCheckResponse, summary="Liveness Probe")
async def liveness_probe():
    """Simple probe to verify the application process is running."""
    return HealthCheckResponse(
        status="healthy",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT
    )


@router.get("/ready", response_model=ReadinessResponse, summary="Readiness Probe")
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """Verifies that the application can communicate with external backing stores (database)."""
    checks = {}
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        return ReadinessResponse(status="not_ready", checks=checks)

    return ReadinessResponse(status="ready", checks=checks)
