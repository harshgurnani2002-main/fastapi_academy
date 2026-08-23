import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cache_warming_and_metrics_telemetry(client: AsyncClient):
    # 1. Seed 3 products
    for i in range(1, 4):
        await client.post("/api/v1/products", json={
            "sku": f"WARM-SKU-{i}",
            "name": f"Warmed Product {i}",
            "description": "Pre-warmed data",
            "price": float(i * 100),
            "stock_quantity": 50,
            "category": "catalog"
        })

    # 2. Trigger cache warming
    warm_res = await client.post("/api/v1/demo/warm-cache")
    assert warm_res.status_code == 200
    assert warm_res.json()["data"]["warmed_count"] >= 3

    # 3. Read products -> 100% cache hit ratio
    for i in range(1, 4):
        r = await client.get(f"/api/v1/products/{i}")
        assert r.status_code == 200

    # 4. Check telemetry
    metrics_res = await client.get("/api/v1/metrics/cache-telemetry")
    assert metrics_res.status_code == 200
    m = metrics_res.json()["data"]
    assert m["hit_ratio_percent"] >= 75.0
    assert m["estimated_latency_saved_ms"] > 0
