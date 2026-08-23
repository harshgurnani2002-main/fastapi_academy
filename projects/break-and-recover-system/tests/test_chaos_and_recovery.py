import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_healthy_slo_status_baseline(client: AsyncClient):
    res = await client.get("/api/v1/reliability/slo-status")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

@pytest.mark.asyncio
async def test_chaos_injection_degrades_slo_burn_rate(client: AsyncClient):
    # Inject DB exhaustion
    await client.post("/api/v1/chaos/inject?scenario=db_exhaustion")
    res = await client.get("/api/v1/reliability/slo-status")
    assert res.json()["status"] == "DEGRADED_ALERTING"
    assert res.json()["current_burn_rate"] > 10.0

@pytest.mark.asyncio
async def test_chaos_recovery_restores_health(client: AsyncClient):
    await client.post("/api/v1/chaos/inject?scenario=db_exhaustion")
    rec = await client.post("/api/v1/chaos/recover")
    assert rec.status_code == 200
    res = await client.get("/api/v1/reliability/slo-status")
    assert res.json()["status"] == "HEALTHY"
