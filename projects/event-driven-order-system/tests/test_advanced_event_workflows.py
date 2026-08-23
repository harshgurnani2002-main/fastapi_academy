import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_multi_order_outbox_batch_relaying(client: AsyncClient):
    # Create 3 orders
    for i in range(1, 4):
        await client.post("/api/v1/orders", json={
            "customer_email": f"client_{i}@corp.com",
            "total_amount": float(i * 100),
            "items": []
        })

    # Relay all 3 pending events
    relay_res = await client.post("/api/v1/events/relay")
    assert relay_res.status_code == 200
    assert relay_res.json()["data"]["events_relayed"] == 3

    # Subsequent relay has 0 pending
    empty_relay = await client.post("/api/v1/events/relay")
    assert empty_relay.json()["data"]["events_relayed"] == 0
