import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_event_and_generate_seats(client: AsyncClient):
    payload = {
        "title": "Coldplay Music of the Spheres",
        "venue": "Wembley Stadium",
        "total_capacity": 5,
        "ticket_price": 95.0
    }
    response = await client.post("/api/v1/events", json=payload)
    assert response.status_code == 201
    event_id = response.json()["data"]["id"]

    # Verify 5 individual seats generated
    tickets_res = await client.get(f"/api/v1/events/{event_id}/tickets")
    assert tickets_res.status_code == 200
    tickets = tickets_res.json()["data"]
    assert len(tickets) == 5
    assert all(t["status"] == "available" for t in tickets)
