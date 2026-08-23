import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_v2_customer_creation_and_update(client: AsyncClient):
    # 1. Create customer
    c_res = await client.post("/v2/customers", json={
        "first_name": "Marcus",
        "last_name": "Aurelius",
        "email": "marcus@philosophy.org",
        "tier": "enterprise"
    })
    assert c_res.status_code == 201
    cust_data = c_res.json()
    assert cust_data["first_name"] == "Marcus"
    assert cust_data["tier"] == "enterprise"
    cust_id = cust_data["id"]

    # 2. Patch customer
    p_res = await client.patch(f"/v2/customers/{cust_id}", json={
        "first_name": "Emperor Marcus"
    })
    assert p_res.status_code == 200
    assert p_res.json()["first_name"] == "Emperor Marcus"


@pytest.mark.asyncio
async def test_v2_search_filter(client: AsyncClient):
    res = await client.get("/v2/customers?search=User2")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 1
    assert any("user2" in item["email"].lower() for item in items)


@pytest.mark.asyncio
async def test_rfc7807_validation_error_structure(client: AsyncClient):
    res = await client.post("/v2/customers", json={
        "first_name": "M",  # too short
        "last_name": "",    # too short
        "email": "bad"      # too short
    })
    assert res.status_code == 422
    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_FAILED"
    assert len(data["error"]["details"]) > 0
