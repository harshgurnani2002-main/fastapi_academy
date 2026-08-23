import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pipeline_status_reporting(client: AsyncClient):
    res = await client.get("/api/v1/pipeline/status")
    assert res.status_code == 200
    assert res.json()["status"] == "PASSING"

@pytest.mark.asyncio
async def test_dora_metrics_lead_time_and_failure_rate(client: AsyncClient):
    res = await client.get("/api/v1/pipeline/status")
    dora = res.json()["dora_metrics"]
    assert dora["change_failure_rate"] == "0.8%"
    assert dora["deployment_frequency"] == "14 per week"

@pytest.mark.asyncio
async def test_pipeline_stages_coverage(client: AsyncClient):
    res = await client.get("/api/v1/pipeline/stages")
    assert res.status_code == 200
    stages = [s["name"] for s in res.json()["stages"]]
    assert "lint" in stages
    assert "security" in stages
    assert "deploy" in stages
