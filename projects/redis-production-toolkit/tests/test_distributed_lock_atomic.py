import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_distributed_lock_mutual_exclusion_and_atomic_release(client: AsyncClient):
    resource = "inventory_item_99"

    # 1. Worker 1 acquires lock
    acq1 = await client.post("/api/v1/locks/acquire", json={"resource_id": resource, "ttl_seconds": 10})
    assert acq1.status_code == 200
    token1 = acq1.json()["data"]["token"]

    # 2. Worker 2 tries to acquire same lock -> 409 Conflict
    acq2 = await client.post("/api/v1/locks/acquire", json={"resource_id": resource, "ttl_seconds": 10})
    assert acq2.status_code == 409

    # 3. Worker 2 attempts release with fake token -> 0 deleted (no release)
    fake_rel = await client.post("/api/v1/locks/release", json={"resource_id": resource, "token": "invalid_token_999"})
    assert fake_rel.status_code == 200
    assert fake_rel.json()["data"]["released"] is False

    # 4. Worker 1 releases with legitimate owner token -> released
    legit_rel = await client.post("/api/v1/locks/release", json={"resource_id": resource, "token": token1})
    assert legit_rel.status_code == 200
    assert legit_rel.json()["data"]["released"] is True

    # 5. Worker 2 can now acquire lock
    acq2_retry = await client.post("/api/v1/locks/acquire", json={"resource_id": resource, "ttl_seconds": 10})
    assert acq2_retry.status_code == 200
