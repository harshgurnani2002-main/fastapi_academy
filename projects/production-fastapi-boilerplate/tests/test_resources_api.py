import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_resource_crud_workflow(client: AsyncClient):
    # Setup User & Login
    await client.post("/api/v1/users", json={
        "email": "author@company.com",
        "username": "author",
        "full_name": "Resource Author",
        "role": "developer",
        "password": "authorPassword123"
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "author@company.com",
        "password": "authorPassword123"
    })
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Resource
    res_create = await client.post("/api/v1/resources", json={
        "title": "API Gateway Configuration",
        "description": "Production routing policies",
        "category": "infrastructure",
        "status": "active"
    }, headers=headers)
    assert res_create.status_code == 201
    res_id = res_create.json()["data"]["id"]

    # 2. Get Resource
    get_res = await client.get(f"/api/v1/resources/{res_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["title"] == "API Gateway Configuration"

    # 3. Update Resource
    update_res = await client.put(f"/api/v1/resources/{res_id}", json={
        "title": "Updated API Gateway Config"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["version"] == 2

    # 4. List Resources
    list_res = await client.get("/api/v1/resources?status=active")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]["items"]) >= 1

    # 5. Delete Resource
    del_res = await client.delete(f"/api/v1/resources/{res_id}", headers=headers)
    assert del_res.status_code == 200

    # 6. Verify 404
    not_found = await client.get(f"/api/v1/resources/{res_id}")
    assert not_found.status_code == 404
