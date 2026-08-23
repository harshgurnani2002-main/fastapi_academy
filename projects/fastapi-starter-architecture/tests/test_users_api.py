import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user_success(client: AsyncClient):
    """Test creating a new user with valid data."""
    payload = {
        "email": "alice@example.com",
        "username": "alice",
        "full_name": "Alice Smith",
        "password": "strongPassword123"
    }
    response = await client.post("/api/v1/users", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == "alice@example.com"
    assert body["data"]["username"] == "alice"
    assert "password" not in body["data"]


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient):
    """Test that creating a user with an existing email returns 409 Conflict."""
    payload = {
        "email": "duplicate@example.com",
        "username": "user1",
        "full_name": "First User",
        "password": "strongPassword123"
    }
    res1 = await client.post("/api/v1/users", json=payload)
    assert res1.status_code == 201

    payload2 = {
        "email": "duplicate@example.com",
        "username": "user2",
        "full_name": "Second User",
        "password": "strongPassword123"
    }
    res2 = await client.post("/api/v1/users", json=payload2)
    assert res2.status_code == 409
    body = res2.json()
    assert body["success"] is False
    assert body["error"]["code"] == "RESOURCE_CONFLICT"


@pytest.mark.asyncio
async def test_get_user_by_id(client: AsyncClient):
    """Test retrieving a created user by ID and 404 for nonexistent user."""
    payload = {
        "email": "bob@example.com",
        "username": "bobsmith",
        "full_name": "Bob Smith",
        "password": "strongPassword123"
    }
    create_res = await client.post("/api/v1/users", json=payload)
    user_id = create_res.json()["data"]["id"]

    get_res = await client.get(f"/api/v1/users/{user_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["username"] == "bobsmith"

    not_found = await client.get("/api/v1/users/99999")
    assert not_found.status_code == 404
    assert not_found.json()["error"]["code"] == "USER_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_users_pagination(client: AsyncClient):
    """Test listing users with pagination."""
    for i in range(5):
        await client.post("/api/v1/users", json={
            "email": f"user{i}@example.com",
            "username": f"user_{i}",
            "full_name": f"User {i}",
            "password": "password123"
        })

    response = await client.get("/api/v1/users?page=1&size=3")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]["items"]) == 3
    assert body["data"]["total"] >= 5
    assert body["data"]["page"] == 1
    assert body["data"]["size"] == 3


@pytest.mark.asyncio
async def test_update_and_delete_user(client: AsyncClient):
    """Test updating user attributes and deleting a user."""
    create_res = await client.post("/api/v1/users", json={
        "email": "carol@example.com",
        "username": "carol",
        "full_name": "Carol Danvers",
        "password": "password123"
    })
    user_id = create_res.json()["data"]["id"]

    update_res = await client.put(f"/api/v1/users/{user_id}", json={
        "full_name": "Captain Marvel"
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["full_name"] == "Captain Marvel"

    del_res = await client.delete(f"/api/v1/users/{user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted"] is True

    get_after = await client.get(f"/api/v1/users/{user_id}")
    assert get_after.status_code == 404
