import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_item_success(client: AsyncClient):
    """Test creating an item with an existing user owner."""
    user_res = await client.post("/api/v1/users", json={
        "email": "seller@example.com",
        "username": "seller1",
        "full_name": "Seller One",
        "password": "password123"
    })
    owner_id = user_res.json()["data"]["id"]

    item_payload = {
        "title": "FastAPI Masterclass Book",
        "description": "Comprehensive guide to building production backends",
        "price": 49.99,
        "owner_id": owner_id,
        "is_published": True
    }
    response = await client.post("/api/v1/items", json=item_payload)
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["title"] == "FastAPI Masterclass Book"
    assert body["data"]["price"] == 49.99
    assert body["data"]["owner_id"] == owner_id


@pytest.mark.asyncio
async def test_create_item_nonexistent_owner(client: AsyncClient):
    """Test creating item with invalid owner ID returns 404."""
    item_payload = {
        "title": "Orphan Item",
        "description": "No owner",
        "price": 19.99,
        "owner_id": 99999,
        "is_published": True
    }
    response = await client.post("/api/v1/items", json=item_payload)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "USER_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_items_and_filtering(client: AsyncClient):
    """Test listing items and filtering by published state."""
    user_res = await client.post("/api/v1/users", json={
        "email": "vendor@example.com",
        "username": "vendor",
        "full_name": "Vendor User",
        "password": "password123"
    })
    owner_id = user_res.json()["data"]["id"]

    await client.post("/api/v1/items", json={
        "title": "Published Item",
        "description": "Visible",
        "price": 10.0,
        "owner_id": owner_id,
        "is_published": True
    })
    await client.post("/api/v1/items", json={
        "title": "Draft Item",
        "description": "Hidden",
        "price": 20.0,
        "owner_id": owner_id,
        "is_published": False
    })

    # All items
    all_res = await client.get("/api/v1/items")
    assert all_res.status_code == 200
    assert len(all_res.json()["data"]["items"]) >= 2

    # Published only
    pub_res = await client.get("/api/v1/items?published_only=true")
    assert pub_res.status_code == 200
    items = pub_res.json()["data"]["items"]
    assert all(i["is_published"] is True for i in items)


@pytest.mark.asyncio
async def test_update_and_delete_item(client: AsyncClient):
    """Test updating and deleting an item."""
    user_res = await client.post("/api/v1/users", json={
        "email": "dev@example.com",
        "username": "developer",
        "full_name": "Developer",
        "password": "password123"
    })
    owner_id = user_res.json()["data"]["id"]

    item_res = await client.post("/api/v1/items", json={
        "title": "Original Title",
        "description": "Original Desc",
        "price": 100.0,
        "owner_id": owner_id,
        "is_published": True
    })
    item_id = item_res.json()["data"]["id"]

    update_res = await client.put(f"/api/v1/items/{item_id}", json={"price": 120.0, "title": "Updated Title"})
    assert update_res.status_code == 200
    assert update_res.json()["data"]["price"] == 120.0
    assert update_res.json()["data"]["title"] == "Updated Title"

    del_res = await client.delete(f"/api/v1/items/{item_id}")
    assert del_res.status_code == 200

    get_res = await client.get(f"/api/v1/items/{item_id}")
    assert get_res.status_code == 404
