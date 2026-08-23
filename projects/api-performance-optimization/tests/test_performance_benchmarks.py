import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_n_plus_one_vs_vectorized_optimization(client: AsyncClient):
    # 1. Seed data
    await client.post("/api/v1/benchmarks/seed")

    # 2. Run unoptimized N+1
    slow_res = await client.get("/api/v1/benchmarks/unoptimized-n-plus-one")
    assert slow_res.status_code == 200
    slow_data = slow_res.json()
    assert slow_data["query_count"] == 11  # 1 initial + 10 per author
    assert slow_data["simulated_latency_ms"] >= 100.0

    # 3. Run optimized vectorized
    fast_res = await client.get("/api/v1/benchmarks/optimized-vectorized")
    assert fast_res.status_code == 200
    fast_data = fast_res.json()
    assert fast_data["query_count"] == 2   # Exactly 2 queries
    assert fast_data["simulated_latency_ms"] < slow_data["simulated_latency_ms"]
