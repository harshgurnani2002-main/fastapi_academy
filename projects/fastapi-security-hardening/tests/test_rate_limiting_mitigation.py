import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rate_limiting_defense(client: AsyncClient):
    # Send requests up to rate limit threshold (10 req/min)
    for _ in range(10):
        res = await client.get("/api/v1/hardened/search?query=test")
        assert res.status_code == 200

    # 11th request exceeds limit -> 429 Too Many Requests
    blocked_res = await client.get("/api/v1/hardened/search?query=test")
    assert blocked_res.status_code == 429
    assert blocked_res.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
