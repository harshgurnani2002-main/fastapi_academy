import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_registration_login_profile_and_logout(client: AsyncClient):
    # 1. Register
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "sarah@company.com",
        "username": "sarah",
        "full_name": "Sarah Connor",
        "password": "superSecurePassword123",
        "role": "developer"
    })
    assert reg_res.status_code == 201

    # 2. Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "sarah@company.com",
        "password": "superSecurePassword123"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()["data"]
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    assert access_token is not None
    assert refresh_token is not None

    # 3. Access /auth/me
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "sarah@company.com"

    # 4. Logout
    logout_res = await client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # 5. Access after logout -> 401 Unauthorized (Token Blacklisted)
    me_after = await client.get("/api/v1/auth/me", headers=headers)
    assert me_after.status_code == 401
