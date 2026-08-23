"""
Interactive Cache Stampede & Request Coalescing Demonstrator
============================================================
"""

import asyncio
import time
from fastapi import APIRouter, Depends
from src.core.dependencies import get_caching_service
from src.services.caching_service import CachingService
from src.schemas.common import APIResponse

router = APIRouter(prefix="/demo", tags=["Cache Simulator"])


@router.post("/simulate-coalescing", response_model=APIResponse[dict], summary="Simulate 30 Concurrent Requests on Cold Cache")
async def simulate_coalescing(
    product_id: int = 1,
    caching_service: CachingService = Depends(get_caching_service)
):
    start = time.perf_counter()
    # Invalidate key first to ensure cold cache
    await caching_service.invalidate_product(product_id)

    initial_db_queries = CachingService.stats["db_queries"]

    # Dispatch 30 parallel concurrent tasks simultaneously
    async def request_task():
        data, source, lat = await caching_service.get_product(product_id)
        return {"source": source, "latency_ms": lat}

    tasks = [request_task() for _ in range(30)]
    results = await asyncio.gather(*tasks)

    db_queries_triggered = CachingService.stats["db_queries"] - initial_db_queries
    duration_ms = (time.perf_counter() - start) * 1000.0

    return APIResponse(
        message="Request coalescing simulation complete",
        data={
            "concurrent_requests_sent": 30,
            "database_queries_executed": db_queries_triggered,
            "requests_coalesced": 30 - db_queries_triggered,
            "total_simulation_duration_ms": round(duration_ms, 2),
            "summary": f"SingleFlight collapsed 30 concurrent requests into exactly {db_queries_triggered} database query."
        }
    )


@router.post("/warm-cache", response_model=APIResponse[dict], summary="Pre-warm Top Product Caches")
async def warm_cache(caching_service: CachingService = Depends(get_caching_service)):
    products = await caching_service.product_repo.list(limit=20)
    for p in products:
        p_dict = {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "stock_quantity": p.stock_quantity,
            "category": p.category
        }
        caching_service.l1.set(f"product:{p.id}", p_dict, ttl_seconds=60)
        await caching_service.l2.set(f"product:{p.id}", p_dict, ttl_seconds=300)

    return APIResponse(
        message=f"Pre-warmed {len(products)} products into L1 and L2 caches",
        data={"warmed_count": len(products)}
    )
