import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ssrf_defense_engine(client: AsyncClient):
    # 1. AWS Cloud Metadata Attack (169.254.169.254) -> BLOCKED
    aws_res = await client.post("/api/v1/hardened/webhooks/trigger", json={
        "webhook_url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"
    })
    assert aws_res.status_code == 400
    assert aws_res.json()["error"]["code"] == "SSRF_BLOCKED"

    # 2. Internal Loopback Attack (127.0.0.1 / localhost) -> BLOCKED
    local_res = await client.post("/api/v1/hardened/webhooks/trigger", json={
        "webhook_url": "http://127.0.0.1:6379/flushall"
    })
    assert local_res.status_code == 400
    assert local_res.json()["error"]["code"] == "SSRF_BLOCKED"

    # 3. Legitimate Public Webhook -> ALLOWED
    safe_res = await client.post("/api/v1/hardened/webhooks/trigger", json={
        "webhook_url": "https://api.github.com/events"
    })
    assert safe_res.status_code == 200
    assert safe_res.json()["data"]["status"] == "verified_and_dispatched"
