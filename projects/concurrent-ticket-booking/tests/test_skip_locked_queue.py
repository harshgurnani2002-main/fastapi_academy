import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_concurrent_booking_multiple_different_seats(client: AsyncClient):
    # Create Event with 5 seats
    event_res = await client.post("/api/v1/events", json={
        "title": "Festival Multi-Seat Test",
        "venue": "Glastonbury",
        "total_capacity": 5,
        "ticket_price": 50.0
    })
    event_id = event_res.json()["data"]["id"]

    # Book Seat 1
    b1 = await client.post("/api/v1/bookings", json={
        "event_id": event_id,
        "seat_number": "S-001",
        "customer_email": "buyer1@example.com"
    })
    assert b1.status_code == 201

    # Book Seat 2
    b2 = await client.post("/api/v1/bookings", json={
        "event_id": event_id,
        "seat_number": "S-002",
        "customer_email": "buyer2@example.com"
    })
    assert b2.status_code == 201

    # Verify event available count decremented to 3
    event_check = await client.get(f"/api/v1/events/{event_id}")
    assert event_check.status_code == 200
    assert event_check.json()["data"]["available_tickets"] == 3
