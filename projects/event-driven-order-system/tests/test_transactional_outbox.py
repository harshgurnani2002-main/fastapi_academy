import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_creation_and_outbox_relay(client: AsyncClient):
    # 1. Create order
    create_res = await client.post("/api/v1/orders", json={
        "customer_email": "jane.doe@enterprise.com",
        "total_amount": 499.50,
        "items": [{"sku": "MACBOOK-AIR", "quantity": 1, "price": 499.50}]
    })
    assert create_res.status_code == 201
    order_data = create_res.json()["data"]
    assert order_data["status"] == "CREATED"

    # 2. Relay outbox events to stream
    relay_res = await client.post("/api/v1/events/relay")
    assert relay_res.status_code == 200
    relay_data = relay_res.json()["data"]
    assert relay_data["events_relayed"] == 1

    # 3. Verify event stream record
    stream_res = await client.get("/api/v1/events/stream/records")
    assert stream_res.status_code == 200
    records = stream_res.json()["data"]
    assert len(records) == 1
    assert records[0]["fields"]["aggregate_id"] == order_data["order_number"]
