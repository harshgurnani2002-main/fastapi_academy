import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_concurrency_race_simulation_endpoint(client: AsyncClient):
    event_res = await client.post("/api/v1/events", json={
        "title": "Flash Sale Championship",
        "venue": "Madison Square Garden",
        "total_capacity": 3,
        "ticket_price": 100.0
    })
    event_id = event_res.json()["data"]["id"]

    sim_res = await client.post("/api/v1/concurrency/simulate", json={
        "event_id": event_id,
        "concurrent_buyers": 10,
        "mode": "pessimistic_lock"
    })
    assert sim_res.status_code == 200
    data = sim_res.json()["data"]
    assert data["oversold_count"] == 0
    assert data["successful_bookings"] <= 3
