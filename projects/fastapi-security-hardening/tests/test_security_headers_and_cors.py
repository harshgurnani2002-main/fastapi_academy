import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_injection(client: AsyncClient):
    res = await client.get("/api/v1/hardened/search?query=health")
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"
    assert "Strict-Transport-Security" in res.headers
    assert "Content-Security-Policy" in res.headers
    assert res.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
