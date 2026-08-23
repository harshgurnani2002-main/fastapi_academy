import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from src.core.database import get_db_session, get_pool_status
from src.schemas.common import APIResponse
from src.schemas.diagnostics import PoolDiagnosticsResponse

router = APIRouter(prefix="/diagnostics", tags=["Database Engine Diagnostics"])


@router.get("/pool", response_model=APIResponse[PoolDiagnosticsResponse], summary="Connection Pool Health Probe")
async def get_pool_diagnostics(session: AsyncSession = Depends(get_db_session)):
    start = time.perf_counter()
    res = await session.execute(text("SELECT 1"))
    latency_ms = (time.perf_counter() - start) * 1000.0

    pool_metrics = get_pool_status()

    return APIResponse(
        data=PoolDiagnosticsResponse(
            status="healthy",
            pool_metrics=pool_metrics,
            query_latency_ms=round(latency_ms, 2),
            database_version="PostgreSQL 16.2 / SQLite Async"
        )
    )
