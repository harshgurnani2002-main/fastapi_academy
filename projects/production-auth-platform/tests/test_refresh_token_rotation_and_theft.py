import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_replay_theft_detection(client: AsyncClient):
    # Register & Login
    await client.post("/api/v1/auth/register", json={
        "email": "theft_test@company.com",
        "username": "theft_test",
        "full_name": "Theft Test User",
        "password": "password123",
        "role": "user"
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "theft_test@company.com",
        "password": "password123"
    })
    r1 = login_res.json()["data"]["refresh_token"]

    # 1. Normal Rotation (Using R1 generates R2 and marks R1 as used)
    refresh_res_1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": r1})
    assert refresh_res_1.status_code == 200
    r2 = refresh_res_1.json()["data"]["refresh_token"]
    assert r2 != r1

    # 2. Legitimate User rotates R2 -> generates R3
    refresh_res_2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": r2})
    assert refresh_res_2.status_code == 200
    r3 = refresh_res_2.json()["data"]["refresh_token"]

    # 3. REPLAY ATTACK: Attacker tries to use stolen old token R1 -> THEFT DETECTED!
    theft_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": r1})
    assert theft_res.status_code == 401
    assert theft_res.json()["error"]["code"] == "TOKEN_THEFT_DETECTED"

    # 4. Entire token family is revoked! Legitimate user with R3 is now also logged out for safety
    r3_use_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": r3})
    assert r3_use_res.status_code == 401
