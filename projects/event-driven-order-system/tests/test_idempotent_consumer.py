import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_idempotent_consumer_deduplication(client: AsyncClient):
    # 1. Create and relay order
    await client.post("/api/v1/orders", json={
        "customer_email": "alex@startup.io",
        "total_amount": 150.00,
        "items": []
    })
    await client.post("/api/v1/events/relay")

    # 2. Consume events 1st time -> 1 processed, 0 duplicates
    c1 = await client.post("/api/v1/events/consume", json={
        "consumer_name": "inventory_service",
        "stream_name": "stream:orders"
    })
    assert c1.status_code == 200
    assert c1.json()["data"]["events_processed"] == 1
    assert c1.json()["data"]["duplicates_skipped"] == 0

    # 3. Consume events 2nd time (duplicate delivery) -> 0 processed, 1 duplicate skipped!
    c2 = await client.post("/api/v1/events/consume", json={
        "consumer_name": "inventory_service",
        "stream_name": "stream:orders"
    })
    assert c2.status_code == 200
    assert c2.json()["data"]["events_processed"] == 0
    assert c2.json()["data"]["duplicates_skipped"] == 1
