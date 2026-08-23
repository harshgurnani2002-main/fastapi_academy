import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cache_lifecycle_and_stats(client: AsyncClient):
    # 1. Set Cache Key
    set_res = await client.post("/api/v1/cache", json={
        "key": "user_profile:1001",
        "value": {"name": "Alice Smith", "tier": "enterprise"},
        "ttl_seconds": 60
    })
    assert set_res.status_code == 201

    # 2. Get Cache Key -> Hit
    get_res = await client.get("/api/v1/cache/user_profile:1001")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["value"]["name"] == "Alice Smith"

    # 3. Nonexistent Key -> 404
    missing_res = await client.get("/api/v1/cache/unknown_key")
    assert missing_res.status_code == 404

    # 4. Check Stats (1 hit, 1 miss -> 50% hit ratio)
    stats_res = await client.get("/api/v1/cache/stats/summary")
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_ratio"] == 50.0

    # 5. Evict Key
    del_res = await client.delete("/api/v1/cache/user_profile:1001")
    assert del_res.status_code == 200
    assert (await client.get("/api/v1/cache/user_profile:1001")).status_code == 404
