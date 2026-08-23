import pytest
from httpx import AsyncClient
from src.services.caching_service import CachingService


@pytest.mark.asyncio
async def test_negative_caching_for_404s(client: AsyncClient):
    nonexistent_id = 999999

    # 1. First lookup: executes 1 DB query and returns 404
    r1 = await client.get(f"/api/v1/products/{nonexistent_id}")
    assert r1.status_code == 404
    assert CachingService.stats["db_queries"] == 1

    # 2. Second lookup: hits NEGATIVE_CACHE and does NOT query DB!
    r2 = await client.get(f"/api/v1/products/{nonexistent_id}")
    assert r2.status_code == 404
    assert CachingService.stats["db_queries"] == 1
    assert CachingService.stats["negative_hits"] == 1
