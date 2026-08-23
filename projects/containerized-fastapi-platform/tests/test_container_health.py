import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_container_liveness_probe(client: AsyncClient):
    res = await client.get("/health/live")
    assert res.status_code == 200
    assert res.json()["status"] == "LIVE"

@pytest.mark.asyncio
async def test_container_readiness_probe_dependencies(client: AsyncClient):
    res = await client.get("/health/ready")
    assert res.status_code == 200
    assert res.json()["services"]["postgres"] == "CONNECTED"
    assert res.json()["services"]["redis"] == "CONNECTED"

@pytest.mark.asyncio
async def test_container_info_and_multi_stage_spec(client: AsyncClient):
    res = await client.get("/api/v1/container/info")
    assert res.status_code == 200
    assert res.json()["non_root_user"] == "appuser (UID 10001)"
    assert res.json()["multi_stage"] is True
