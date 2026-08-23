import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_l1_and_l2_cache_hits(client: AsyncClient):
    # 1. Create product
    create_res = await client.post("/api/v1/products", json={
        "sku": "PROD-APPLE-M3",
        "name": "Apple MacBook Pro M3",
        "description": "High performance laptop",
        "price": 1999.0,
        "stock_quantity": 50,
        "category": "electronics"
    })
    assert create_res.status_code == 201
    prod_id = create_res.json()["data"]["id"]

    # 2. First read: already in L1/L2 from create -> L1_MEMORY hit (sub-millisecond)
    r1 = await client.get(f"/api/v1/products/{prod_id}")
    assert r1.status_code == 200
    assert r1.json()["data"]["cache_source"] in ["L1_MEMORY", "L2_REDIS"]
    assert r1.json()["data"]["price"] == 1999.0

    # 3. Simulate L1 expiration (clear L1) -> next read hits L2_REDIS
    from src.services.caching_service import l1_cache
    l1_cache.clear()

    r2 = await client.get(f"/api/v1/products/{prod_id}")
    assert r2.status_code == 200
    assert r2.json()["data"]["cache_source"] == "L2_REDIS"
