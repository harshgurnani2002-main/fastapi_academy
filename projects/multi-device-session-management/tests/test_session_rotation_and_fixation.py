import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_session_rotation_and_fixation_prevention(client: AsyncClient):
    # 1. Login
    login_res = await client.post("/api/v1/sessions/login", json={"user_id": "usr_emily", "username": "Emily", "device_name": "Pixel 8"})
    old_token = login_res.json()["data"]["session_id"]

    # 2. Rotate session
    rot_res = await client.post("/api/v1/sessions/rotate", headers={"x-session-id": old_token})
    assert rot_res.status_code == 200
    new_token = rot_res.json()["data"]["session_id"]
    assert new_token != old_token

    # 3. Old token is now invalid -> 401 Unauthorized
    retry_old = await client.post("/api/v1/sessions/rotate", headers={"x-session-id": old_token})
    assert retry_old.status_code == 401
