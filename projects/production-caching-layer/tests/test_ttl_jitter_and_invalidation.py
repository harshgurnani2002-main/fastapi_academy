import pytest
from httpx import AsyncClient
from src.core.redis_cache import apply_jitter


def test_ttl_jitter_variation():
    base = 300
    jitters = [apply_jitter(base, jitter_pct=0.15) for _ in range(50)]
    # All values must fall within ±15% range [255, 345]
    assert all(255 <= j <= 345 for j in jitters)
    # Not all values are identical (proves randomness prevents avalanche)
    assert len(set(jitters)) > 1


@pytest.mark.asyncio
async def test_update_invalidates_cache(client: AsyncClient):
    create_res = await client.post("/api/v1/products", json={
        "sku": "UPDATE-TEST",
        "name": "Initial Name",
        "description": "Test",
        "price": 10.0,
        "stock_quantity": 10,
        "category": "test"
    })
    prod_id = create_res.json()["data"]["id"]

    # Update product price
    up_res = await client.put(f"/api/v1/products/{prod_id}", json={"price": 19.99})
    assert up_res.status_code == 200

    # Fetch updated product -> reflects fresh 19.99
    fetch_res = await client.get(f"/api/v1/products/{prod_id}")
    assert fetch_res.status_code == 200
    assert fetch_res.json()["data"]["price"] == 19.99
