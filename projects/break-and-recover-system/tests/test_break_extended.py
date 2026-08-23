import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_error_budget_and_latency_chaos(client: AsyncClient):
    b_res = await client.get("/api/v1/reliability/error-budget")
    assert b_res.status_code == 200
    assert b_res.json()["error_budget_minutes_per_month"] == 43.2

    l_res = await client.post("/api/v1/chaos/inject?scenario=latency")
    assert l_res.status_code == 200
    assert l_res.json()["chaos_active"]["latency_injected"] is True
