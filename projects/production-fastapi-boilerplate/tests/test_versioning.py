import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_api_versioning_differences(client: AsyncClient):
    # Create User and Resource
    await client.post("/api/v1/users", json={
        "email": "vtester@company.com",
        "username": "vtester",
        "full_name": "Version Tester",
        "role": "user",
        "password": "testPassword123"
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "vtester@company.com",
        "password": "testPassword123"
    })
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/resources", json={
        "title": "Versioned Asset",
        "description": "Compatibility test",
        "category": "core",
        "status": "active"
    }, headers=headers)

    # Query v1
    v1_res = await client.get("/api/v1/resources")
    assert v1_res.status_code == 200
    v1_item = v1_res.json()["data"]["items"][0]
    assert "audit_tag" not in v1_item

    # Query v2
    v2_res = await client.get("/api/v2/resources")
    assert v2_res.status_code == 200
    v2_item = v2_res.json()["data"]["items"][0]
    assert "audit_tag" in v2_item
    assert "is_deprecated" in v2_item
