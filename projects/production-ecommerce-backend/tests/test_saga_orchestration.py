import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_successful_saga_checkout(client: AsyncClient):
    res = await client.post("/api/v1/checkout/saga", json={
        "order_id": "ORD-1001",
        "item_sku": "ITEM-MACBOOK",
        "amount": 1499.0
    })
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_saga_payment_failure_triggers_compensation(client: AsyncClient):
    res = await client.post("/api/v1/checkout/saga", json={
        "order_id": "ORD-1002",
        "item_sku": "ITEM-MACBOOK",
        "amount": 1499.0,
        "simulate_payment_failure": True
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "ROLLED_BACK"
    assert "COMPENSATION: INVENTORY_RESTORED" in data["logs"]

@pytest.mark.asyncio
async def test_saga_out_of_stock_failure(client: AsyncClient):
    res = await client.post("/api/v1/checkout/saga", json={
        "order_id": "ORD-1003",
        "item_sku": "NON_EXISTENT_ITEM_SKU",
        "amount": 99.0
    })
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "FAILED"
    assert res.json()["data"]["reason"] == "OUT_OF_STOCK"
