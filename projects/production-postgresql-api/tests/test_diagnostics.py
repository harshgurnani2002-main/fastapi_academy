import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_pool_diagnostics_probe(client: AsyncClient):
    response = await client.get("/api/v1/diagnostics/pool")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "healthy"
    assert "pool_metrics" in data
    assert "query_latency_ms" in data
