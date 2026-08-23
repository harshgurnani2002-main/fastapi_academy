import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_concurrent_session_limit_evicts_oldest(client: AsyncClient):
    uid = "usr_david_99"

    # Login device 1 (iPhone)
    r1 = await client.post("/api/v1/sessions/login", json={"user_id": uid, "username": "David", "device_name": "iPhone 15"})
    s1 = r1.json()["data"]["session_id"]

    # Login device 2 (MacBook)
    r2 = await client.post("/api/v1/sessions/login", json={"user_id": uid, "username": "David", "device_name": "MacBook Pro"})
    s2 = r2.json()["data"]["session_id"]

    # Login device 3 (iPad)
    r3 = await client.post("/api/v1/sessions/login", json={"user_id": uid, "username": "David", "device_name": "iPad Pro"})
    s3 = r3.json()["data"]["session_id"]

    # Active count is 3
    active_res = await client.get(f"/api/v1/sessions/active?user_id={uid}")
    assert active_res.json()["data"]["total_active"] == 3

    # Login device 4 (Windows PC) -> Exceeds max 3 cap, must evict s1 (iPhone)
    r4 = await client.post("/api/v1/sessions/login", json={"user_id": uid, "username": "David", "device_name": "Windows PC"})
    s4 = r4.json()["data"]["session_id"]

    active_after = await client.get(f"/api/v1/sessions/active?user_id={uid}")
    assert active_after.json()["data"]["total_active"] == 3
    session_ids = [s["session_id"] for s in active_after.json()["data"]["sessions"]]
    assert s1 not in session_ids
    assert s4 in session_ids
