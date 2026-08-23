import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_k8s_liveness_probe(client: AsyncClient):
    res = await client.get("/health/live")
    assert res.status_code == 200
    assert res.json()["status"] == "LIVE"

@pytest.mark.asyncio
async def test_k8s_readiness_probe_traffic_gate(client: AsyncClient):
    res = await client.get("/health/ready")
    assert res.status_code == 200
    assert res.json()["traffic_enabled"] is True

@pytest.mark.asyncio
async def test_k8s_deployment_and_hpa_specs(client: AsyncClient):
    res = await client.get("/api/v1/k8s/deployment")
    assert res.status_code == 200
    data = res.json()
    assert data["replicas"] == 3
    assert data["hpa"]["cpu_target"] == 70
    assert data["rolling_update"]["maxSurge"] == 1
