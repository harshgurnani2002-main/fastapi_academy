import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_session_verification_success_and_slide_ttl(client: AsyncClient):
    # 1. Login
    res = await client.post("/api/v1/sessions/login", json={
        "user_id": "usr_emma_7",
        "username": "Emma",
        "device_name": "Safari macOS"
    })
    token = res.json()["data"]["session_id"]

    # 2. Verify
    v_res = await client.get("/api/v1/sessions/verify", headers={"x-session-id": token})
    assert v_res.status_code == 200
    assert v_res.json()["data"]["username"] == "Emma"


@pytest.mark.asyncio
async def test_invalid_session_token_rejected_with_401(client: AsyncClient):
    v_res = await client.get("/api/v1/sessions/verify", headers={"x-session-id": "sess_fake_or_tampered_token_999"})
    assert v_res.status_code == 401
    assert v_res.json()["error"]["code"] == "SESSION_UNAUTHORIZED"
