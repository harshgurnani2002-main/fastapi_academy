import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_booking_single_seat_success_and_conflict(client: AsyncClient):
    # 1. Create Event
    event_res = await client.post("/api/v1/events", json={
        "title": "Taylor Swift Eras Tour",
        "venue": "SoFi Stadium",
        "total_capacity": 2,
        "ticket_price": 150.0
    })
    event_id = event_res.json()["data"]["id"]

    # 2. User 1 books seat S-001 -> 201 Created
    b1_res = await client.post("/api/v1/bookings", json={
        "event_id": event_id,
        "seat_number": "S-001",
        "customer_email": "user1@example.com"
    })
    assert b1_res.status_code == 201
    assert b1_res.json()["data"]["seat_number"] == "S-001"

    # 3. User 2 attempts to book same seat S-001 -> 409 Conflict
    b2_res = await client.post("/api/v1/bookings", json={
        "event_id": event_id,
        "seat_number": "S-001",
        "customer_email": "user2@example.com"
    })
    assert b2_res.status_code == 409
    assert b2_res.json()["error"]["code"] == "SEAT_UNAVAILABLE"
