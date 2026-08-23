import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_role_enforcement(client: AsyncClient):
    # Create Admin
    await client.post("/api/v1/users", json={
        "email": "admin@company.com",
        "username": "adminuser",
        "full_name": "Admin User",
        "role": "admin",
        "password": "adminPassword123"
    })
    admin_login = await client.post("/api/v1/auth/login", json={
        "email": "admin@company.com",
        "password": "adminPassword123"
    })
    admin_token = admin_login.json()["data"]["access_token"]

    # Create Standard User
    await client.post("/api/v1/users", json={
        "email": "regular@company.com",
        "username": "regularuser",
        "full_name": "Regular User",
        "role": "user",
        "password": "userPassword123"
    })
    user_login = await client.post("/api/v1/auth/login", json={
        "email": "regular@company.com",
        "password": "userPassword123"
    })
    user_token = user_login.json()["data"]["access_token"]

    # Standard user attempting admin endpoint -> 403 Forbidden
    forbidden_res = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {user_token}"})
    assert forbidden_res.status_code == 403

    # Admin accessing list users -> 200 OK
    admin_res = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    assert admin_res.json()["data"]["total"] >= 2
