import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_fetch_and_status_progression(client: AsyncClient):
    # 1. Create order
    create_res = await client.post("/api/v1/orders", json={
        "customer_email": "test@enterprise.com",
        "total_amount": 299.0,
        "items": []
    })
    order_num = create_res.json()["data"]["order_number"]

    # 2. Fetch order by order_number
    get_res = await client.get(f"/api/v1/orders/{order_num}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["status"] == "CREATED"

    # 3. Relay outbox
    await client.post("/api/v1/events/relay")

    # 4. Consume events -> advances status to PROCESSING
    await client.post("/api/v1/events/consume", json={
        "consumer_name": "fulfillment_worker",
        "stream_name": "stream:orders"
    })

    # 5. Fetch order again -> status is now PROCESSING
    updated_res = await client.get(f"/api/v1/orders/{order_num}")
    assert updated_res.json()["data"]["status"] == "PROCESSING"


@pytest.mark.asyncio
async def test_invalid_order_amount_rejected(client: AsyncClient):
    res = await client.post("/api/v1/orders", json={
        "customer_email": "bad@email.com",
        "total_amount": -50.0  # ge 0.01 required
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_multi_consumer_group_isolation(client: AsyncClient):
    # 1. Create and relay order
    await client.post("/api/v1/orders", json={"customer_email": "c1@org.com", "total_amount": 100.0})
    await client.post("/api/v1/events/relay")

    # Consumer A processes it
    cA = await client.post("/api/v1/events/consume", json={"consumer_name": "service_billing", "stream_name": "stream:orders"})
    assert cA.json()["data"]["events_processed"] == 1

    # Consumer B also processes it independently
    cB = await client.post("/api/v1/events/consume", json={"consumer_name": "service_analytics", "stream_name": "stream:orders"})
    assert cB.json()["data"]["events_processed"] == 1
