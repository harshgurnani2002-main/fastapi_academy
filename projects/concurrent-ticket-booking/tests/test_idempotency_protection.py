import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_idempotency_token_replays_cached_booking(client: AsyncClient):
    event_res = await client.post("/api/v1/events", json={
        "title": "Idempotency Test Concert",
        "venue": "Red Rocks",
        "total_capacity": 5,
        "ticket_price": 80.0
    })
    event_id = event_res.json()["data"]["id"]

    idempotency_token = "idemp_token_unique_98765"
    headers = {"Idempotency-Key": idempotency_token}
    payload = {
        "event_id": event_id,
        "seat_number": "S-001",
        "customer_email": "retry_buyer@example.com"
    }

    # 1. Initial Request
    res1 = await client.post("/api/v1/bookings", json=payload, headers=headers)
    assert res1.status_code == 201
    booking_id_1 = res1.json()["data"]["id"]

    # 2. Retried Request with same Idempotency-Key (simulating network retry)
    res2 = await client.post("/api/v1/bookings", json=payload, headers=headers)
    assert res2.status_code == 201
    booking_id_2 = res2.json()["data"]["id"]

    # Both requests must return the exact same booking record without duplicate charging
    assert booking_id_1 == booking_id_2
