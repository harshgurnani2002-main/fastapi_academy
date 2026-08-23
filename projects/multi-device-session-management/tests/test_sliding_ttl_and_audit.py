import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_single_device_revocation(client: AsyncClient):
    uid = "usr_sarah_11"
    r1 = await client.post("/api/v1/sessions/login", json={"user_id": uid, "username": "Sarah", "device_name": "Firefox"})
    s_id = r1.json()["data"]["session_id"]

    # Revoke session
    del_res = await client.delete(f"/api/v1/sessions/{s_id}")
    assert del_res.status_code == 200
    assert del_res.json()["data"]["revoked"] is True

    # Active count is 0
    active = await client.get(f"/api/v1/sessions/active?user_id={uid}")
    assert active.json()["data"]["total_active"] == 0
