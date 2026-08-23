import pytest
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_circuit_breaker_healthy_closed_state(client: AsyncClient):
    res = await client.get("/api/v1/resilient/service-call")
    assert res.status_code == 200
    assert res.json()["circuit_state"] == "CLOSED"

@pytest.mark.asyncio
async def test_circuit_trips_to_open_on_consecutive_failures(client: AsyncClient):
    # Enable chaos
    await client.post("/api/v1/chaos/toggle-failure?enable=true")

    # Trip 3 failures
    for _ in range(3):
        await client.get("/api/v1/resilient/service-call")

    # Next call fails fast with 503 OPEN
    r_tripped = await client.get("/api/v1/resilient/service-call")
    assert r_tripped.status_code == 503
    assert r_tripped.json()["detail"]["circuit_state"] == "OPEN"

    # Reset
    await client.post("/api/v1/chaos/toggle-failure?enable=false")

@pytest.mark.asyncio
async def test_circuit_recovery_half_open_to_closed(client: AsyncClient):
    await client.post("/api/v1/chaos/toggle-failure?enable=true")
    for _ in range(3):
        await client.get("/api/v1/resilient/service-call")

    await client.post("/api/v1/chaos/toggle-failure?enable=false")
    await asyncio.sleep(0.25)

    res = await client.get("/api/v1/resilient/service-call")
    assert res.status_code == 200
    assert res.json()["circuit_state"] == "CLOSED"
