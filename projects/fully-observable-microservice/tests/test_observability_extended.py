import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_correlation_id_propagation(client: AsyncClient):
    cid = "cid-custom-tracing-uuid-999"
    res = await client.get("/api/v1/business/transaction", headers={"x-correlation-id": cid})
    assert res.status_code == 200
    assert res.json()["correlation_id"] == cid


@pytest.mark.asyncio
async def test_prometheus_500_error_tracking(client: AsyncClient):
    # Trigger 500 error
    err_res = await client.post("/api/v1/orders/simulate-error")
    assert err_res.status_code == 500

    # Verify metrics has recorded the 500 status code
    m_res = await client.get("/metrics")
    assert m_res.status_code == 200
    assert 'status="500"' in m_res.text
