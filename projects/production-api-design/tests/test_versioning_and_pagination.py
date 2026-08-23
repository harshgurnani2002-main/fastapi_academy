import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_v1_and_v2_cursor_pagination(client: AsyncClient):
    # 1. Fetch v1 Page 1 (limit=5)
    r1 = await client.get("/v1/customers?limit=5")
    assert r1.status_code == 200
    d1 = r1.json()
    assert len(d1["items"]) == 5
    assert "full_name" in d1["items"][0]
    assert d1["has_next"] is True
    cursor_1 = d1["next_cursor"]

    # 2. Fetch v1 Page 2 with cursor
    r2 = await client.get(f"/v1/customers?limit=5&cursor={cursor_1}")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["items"][0]["id"] == 6

    # 3. Fetch v2 Page 1 -> structured with first_name, last_name, tier
    r_v2 = await client.get("/v2/customers?limit=5&tier=gold")
    assert r_v2.status_code == 200
    d_v2 = r_v2.json()
    assert "first_name" in d_v2["items"][0]
    assert d_v2["items"][0]["tier"] == "gold"
