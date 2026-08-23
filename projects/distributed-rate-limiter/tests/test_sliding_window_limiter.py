import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sliding_window_log_precision(client: AsyncClient):
    payload = {
        "identifier": "user_alice_101",
        "algorithm": "sliding_window",
        "limit": 3,
        "window_seconds": 60,
        "cost": 1
    }

    # Requests 1, 2, 3 -> Accepted
    for i in range(3):
        res = await client.post("/api/v1/rate-limit/evaluate", json=payload)
        assert res.status_code == 200
        assert res.json()["data"]["is_allowed"] is True
        assert res.json()["data"]["remaining"] == 2 - i

    # Request 4 -> Rejected with Retry-After
    r4 = await client.post("/api/v1/rate-limit/evaluate", json=payload)
    assert r4.status_code == 200
    assert r4.json()["data"]["is_allowed"] is False
    assert r4.json()["data"]["remaining"] == 0
    assert r4.json()["data"]["retry_after_seconds"] >= 1
