import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_token_bucket_allows_burst_capacity(client: AsyncClient):
    payload = {
        "identifier": "api_client_corp",
        "algorithm": "token_bucket",
        "limit": 5,
        "window_seconds": 10,
        "cost": 1
    }

    # Burst of 5 requests at once -> All 5 allowed
    for _ in range(5):
        res = await client.post("/api/v1/rate-limit/evaluate", json=payload)
        assert res.status_code == 200
        assert res.json()["data"]["is_allowed"] is True

    # 6th immediate request -> Rejected (token bucket empty)
    r6 = await client.post("/api/v1/rate-limit/evaluate", json=payload)
    assert r6.status_code == 200
    assert r6.json()["data"]["is_allowed"] is False
