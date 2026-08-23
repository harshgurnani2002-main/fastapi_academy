import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_m2m_api_key_generation_and_access(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "m2m@company.com",
        "username": "m2m_dev",
        "full_name": "M2M Developer",
        "password": "password123",
        "role": "developer"
    })
    login_res = await client.post("/api/v1/auth/login", json={"email": "m2m@company.com", "password": "password123"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create API Key
    key_res = await client.post("/api/v1/api-keys", json={
        "name": "GitHub CI/CD Service Key",
        "scopes": ["deploy:read", "deploy:write"]
    }, headers=headers)
    assert key_res.status_code == 201
    raw_key = key_res.json()["data"]["raw_api_key"]

    # 2. Access M2M route with X-API-Key header
    m2m_res = await client.get("/api/v1/protected/service-m2m", headers={"X-API-Key": raw_key})
    assert m2m_res.status_code == 200
    assert m2m_res.json()["data"]["access"] == "granted"

    # 3. Invalid API key -> 401 Unauthorized
    invalid_res = await client.get("/api/v1/protected/service-m2m", headers={"X-API-Key": "ak_live_invalid_999"})
    assert invalid_res.status_code == 401
