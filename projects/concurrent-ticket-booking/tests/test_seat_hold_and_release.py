import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_hold_seat_workflow(client: AsyncClient):
    event_res = await client.post("/api/v1/events", json={
        "title": "Hold Test Match",
        "venue": "Camp Nou",
        "total_capacity": 3,
        "ticket_price": 60.0
    })
    event_id = event_res.json()["data"]["id"]

    # Hold seat S-001
    hold_res = await client.post(f"/api/v1/bookings/hold?event_id={event_id}", json={
        "seat_number": "S-001",
        "user_email": "holder@example.com",
        "hold_duration_seconds": 600
    })
    assert hold_res.status_code == 200
    assert hold_res.json()["data"]["status"] == "held"

    # Other user trying to hold same seat -> 409 Conflict
    conflict_res = await client.post(f"/api/v1/bookings/hold?event_id={event_id}", json={
        "seat_number": "S-001",
        "user_email": "another@example.com",
        "hold_duration_seconds": 600
    })
    assert conflict_res.status_code == 409
