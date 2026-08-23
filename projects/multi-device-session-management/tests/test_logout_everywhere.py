import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_logout_everywhere_terminates_all_sessions(client: AsyncClient):
    uid = "usr_kevin"

    # Login 3 devices
    for d in ["Chrome", "Firefox", "Safari"]:
        await client.post("/api/v1/sessions/login", json={"user_id": uid, "username": "Kevin", "device_name": d})

    active = await client.get(f"/api/v1/sessions/active?user_id={uid}")
    assert active.json()["data"]["total_active"] == 3

    # Terminate all
    logout_res = await client.post(f"/api/v1/sessions/logout-everywhere?user_id={uid}")
    assert logout_res.status_code == 200
    assert logout_res.json()["data"]["sessions_terminated"] == 3

    # Active count is now 0
    active_after = await client.get(f"/api/v1/sessions/active?user_id={uid}")
    assert active_after.json()["data"]["total_active"] == 0
