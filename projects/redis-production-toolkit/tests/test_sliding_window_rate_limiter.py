import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sliding_window_rate_limiter_lua(client: AsyncClient):
    payload = {
        "identifier": "client_ip_192.168.1.50",
        "limit": 3,
        "window_ms": 60000
    }

    # Request 1, 2, 3 -> Allowed
    for i in range(3):
        res = await client.post("/api/v1/rate-limits/check", json=payload)
        assert res.status_code == 200
        assert res.json()["data"]["is_allowed"] is True

    # Request 4 -> Rejected
    res_rejected = await client.post("/api/v1/rate-limits/check", json=payload)
    assert res_rejected.status_code == 200
    assert res_rejected.json()["data"]["is_allowed"] is False
    assert res_rejected.json()["data"]["remaining_tokens"] == 0
