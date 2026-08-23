import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_l1_caching_and_metrics(client: AsyncClient):
    # 1. Seed
    await client.post("/api/v1/benchmarks/seed")

    # 2. First call is cache miss
    m1 = await client.get("/api/v1/benchmarks/cached")
    assert m1.status_code == 200
    assert m1.json()["source"] == "CACHE_MISS"

    # 3. Second call is cache hit
    m2 = await client.get("/api/v1/benchmarks/cached")
    assert m2.status_code == 200
    assert m2.json()["source"] == "CACHE_HIT"

    # 4. Check telemetry
    metrics = await client.get("/api/v1/benchmarks/metrics")
    assert metrics.status_code == 200
    assert metrics.json()["cache_hits"] >= 1


@pytest.mark.asyncio
async def test_seed_endpoint_returns_success(client: AsyncClient):
    res = await client.post("/api/v1/benchmarks/seed")
    assert res.status_code == 200
    assert "Seeded" in res.json()["message"]
