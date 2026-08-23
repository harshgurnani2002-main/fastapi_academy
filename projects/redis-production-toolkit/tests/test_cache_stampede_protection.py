import pytest
import asyncio
from src.core.redis_client import redis_engine
from src.services.cache_service import CacheService


@pytest.mark.asyncio
async def test_cache_stampede_single_flight_mutex():
    cache_service = CacheService(redis_engine)
    compute_call_count = 0

    async def expensive_db_query():
        nonlocal compute_call_count
        compute_call_count += 1
        await asyncio.sleep(0.05)  # simulate heavy 50ms database load
        return {"report_id": "REP-2026", "revenue": 1500000.0}

    # Simulate 10 simultaneous concurrent requests arriving at the exact same millisecond on a cold cache
    tasks = [
        cache_service.get_or_compute_stampede_protected(
            key="annual_financial_report_2026",
            compute_fn=expensive_db_query,
            ttl_seconds=60
        )
        for _ in range(10)
    ]

    results = await asyncio.gather(*tasks)

    # 1. All 10 requests must receive the correct computed report
    for r in results:
        assert r["report_id"] == "REP-2026"
        assert r["revenue"] == 1500000.0

    # 2. Cache stampede protection ensures the expensive function ran only ONCE!
    assert compute_call_count == 1
