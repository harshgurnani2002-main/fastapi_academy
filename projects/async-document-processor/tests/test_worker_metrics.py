import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_worker_fleet_metrics(client: AsyncClient):
    res = await client.get("/api/v1/dlq/metrics")
    assert res.status_code == 200
    metrics = res.json()["data"]
    assert "tasks_dispatched" in metrics
    assert "tasks_succeeded" in metrics
    assert "tasks_failed" in metrics
    assert "tasks_in_dlq" in metrics
