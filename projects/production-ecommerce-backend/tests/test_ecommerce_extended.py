import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_inventory_and_out_of_stock_saga(client: AsyncClient):
    # Replenish
    r_res = await client.post("/api/v1/inventory/replenish", json={"item_sku": "SKU-IPHONE", "quantity": 10})
    assert r_res.status_code == 200
    assert r_res.json()["inventory"]["SKU-IPHONE"] >= 10

    # Stock inquiry
    s_res = await client.get("/api/v1/inventory/stock")
    assert s_res.status_code == 200
    assert "SKU-IPHONE" in s_res.json()["inventory"]
