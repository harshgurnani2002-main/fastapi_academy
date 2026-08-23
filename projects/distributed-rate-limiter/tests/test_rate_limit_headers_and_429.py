import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ietf_rate_limit_response_headers(client: AsyncClient):
    # Call /tiers/info
    res = await client.get("/api/v1/tiers/info")
    assert res.status_code == 200

    # Verify standard IETF RateLimit headers
    assert "X-RateLimit-Limit" in res.headers
    assert "X-RateLimit-Remaining" in res.headers
    assert "X-RateLimit-Reset" in res.headers
    assert "X-RateLimit-Algorithm" in res.headers
