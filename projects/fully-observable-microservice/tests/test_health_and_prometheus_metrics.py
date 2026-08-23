import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_k8s_probes_and_prometheus_metrics(client: AsyncClient):
    # 1. Check Liveness Probe
    live_res = await client.get("/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "LIVE"

    # 2. Check Readiness Probe
    ready_res = await client.get("/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "READY"

    # 3. Trigger Business Transaction
    tx_res = await client.get("/api/v1/business/transaction")
    assert tx_res.status_code == 200

    # 4. Scrape Prometheus Metrics
    metrics_res = await client.get("/metrics")
    assert metrics_res.status_code == 200
    text = metrics_res.text
    assert "http_requests_total" in text
    assert 'path="/api/v1/business/transaction"' in text
