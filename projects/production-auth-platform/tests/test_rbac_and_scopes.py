import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rbac_and_scope_guards(client: AsyncClient):
    # 1. Super Admin User
    await client.post("/api/v1/auth/register", json={
        "email": "admin@company.com",
        "username": "admin",
        "full_name": "Admin",
        "password": "password123",
        "role": "super_admin"
    })
    adm_login = await client.post("/api/v1/auth/login", json={"email": "admin@company.com", "password": "password123"})
    adm_token = adm_login.json()["data"]["access_token"]

    # 2. Regular User
    await client.post("/api/v1/auth/register", json={
        "email": "user@company.com",
        "username": "user",
        "full_name": "User",
        "password": "password123",
        "role": "user"
    })
    usr_login = await client.post("/api/v1/auth/login", json={"email": "user@company.com", "password": "password123"})
    usr_token = usr_login.json()["data"]["access_token"]

    # Admin accessing admin-only route -> 200 OK
    adm_res = await client.get("/api/v1/protected/admin-only", headers={"Authorization": f"Bearer {adm_token}"})
    assert adm_res.status_code == 200

    # User accessing admin-only route -> 403 Forbidden
    usr_res = await client.get("/api/v1/protected/admin-only", headers={"Authorization": f"Bearer {usr_token}"})
    assert usr_res.status_code == 403

    # Admin with billing:write scope -> 200 OK
    bill_res = await client.get("/api/v1/protected/billing-write", headers={"Authorization": f"Bearer {adm_token}"})
    assert bill_res.status_code == 200
