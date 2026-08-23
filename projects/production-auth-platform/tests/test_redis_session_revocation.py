import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_global_logout_all_devices(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "global_user@company.com",
        "username": "global_user",
        "full_name": "Global User",
        "password": "password123",
        "role": "user"
    })

    # Device 1 Login
    dev1 = await client.post("/api/v1/auth/login", json={"email": "global_user@company.com", "password": "password123"})
    dev1_token = dev1.json()["data"]["access_token"]

    # Device 2 Login
    dev2 = await client.post("/api/v1/auth/login", json={"email": "global_user@company.com", "password": "password123"})
    dev2_token = dev2.json()["data"]["access_token"]

    # Both devices can access /auth/me
    assert (await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {dev1_token}"})).status_code == 200
    assert (await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {dev2_token}"})).status_code == 200

    # Device 1 triggers logout-all
    logout_all_res = await client.post("/api/v1/auth/logout-all", headers={"Authorization": f"Bearer {dev1_token}"})
    assert logout_all_res.status_code == 200
