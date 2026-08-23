import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_fixed_window_counter(client: AsyncClient):
    payload = {
        "identifier": "fixed_user_202",
        "algorithm": "fixed_window",
        "limit": 2,
        "window_seconds": 60
    }

    r1 = await client.post("/api/v1/rate-limit/evaluate", json=payload)
    assert r1.status_code == 200
    assert r1.json()["data"]["is_allowed"] is True

    r2 = await client.post("/api/v1/rate-limit/evaluate", json=payload)
    assert r2.status_code == 200
    assert r2.json()["data"]["is_allowed"] is True

    r3 = await client.post("/api/v1/rate-limit/evaluate", json=payload)
    assert r3.status_code == 200
    assert r3.json()["data"]["is_allowed"] is False
