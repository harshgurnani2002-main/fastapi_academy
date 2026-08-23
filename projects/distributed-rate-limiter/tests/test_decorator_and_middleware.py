import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_burst_simulator_endpoint(client: AsyncClient):
    sim_res = await client.post("/api/v1/simulator/run-burst", json={
        "identifier": "burst_tester_ip",
        "algorithm": "token_bucket",
        "limit": 5,
        "window_seconds": 60,
        "total_burst_requests": 15
    })
    assert sim_res.status_code == 200
    data = sim_res.json()["data"]
    assert data["requests_sent"] == 15
    assert data["accepted"] == 5
    assert data["rejected_429"] == 10
