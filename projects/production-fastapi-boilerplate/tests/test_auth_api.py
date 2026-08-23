import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient):
    # 1. Register User
    reg_payload = {
        "email": "dev@company.com",
        "username": "devuser",
        "full_name": "Developer User",
        "role": "developer",
        "password": "strongPassword123"
    }
    reg_res = await client.post("/api/v1/users", json=reg_payload)
    assert reg_res.status_code == 201

    # 2. Login with valid credentials
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "dev@company.com",
        "password": "strongPassword123"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()["data"]
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 3. Access /auth/me with Bearer token
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token_data['access_token']}"})
    assert me_res.status_code == 200
    user_me = me_res.json()["data"]
    assert user_me["email"] == "dev@company.com"
    assert user_me["role"] == "developer"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    await client.post("/api/v1/users", json={
        "email": "wrong@company.com",
        "username": "wronguser",
        "full_name": "Wrong User",
        "role": "user",
        "password": "correctPassword123"
    })

    login_res = await client.post("/api/v1/auth/login", json={
        "email": "wrong@company.com",
        "password": "badPassword999"
    })
    assert login_res.status_code == 401
    assert login_res.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_refresh_token_flow(client: AsyncClient):
    await client.post("/api/v1/users", json={
        "email": "refresh@company.com",
        "username": "refreshuser",
        "full_name": "Refresh User",
        "role": "user",
        "password": "password123"
    })

    login_res = await client.post("/api/v1/auth/login", json={
        "email": "refresh@company.com",
        "password": "password123"
    })
    refresh_token = login_res.json()["data"]["refresh_token"]

    # Call /auth/refresh
    refresh_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()["data"]
