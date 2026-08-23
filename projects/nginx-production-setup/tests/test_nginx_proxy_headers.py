import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_proxy_header_propagation_ip_and_proto(client: AsyncClient):
    headers = {"X-Forwarded-For": "198.51.100.42", "X-Forwarded-Proto": "https", "Host": "api.enterprise.io"}
    res = await client.get("/api/v1/proxy/verify", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["forwarded_for"] == "198.51.100.42"
    assert data["tls_terminated"] is True

@pytest.mark.asyncio
async def test_proxy_direct_call_fallback(client: AsyncClient):
    res = await client.get("/api/v1/proxy/verify")
    assert res.status_code == 200
    assert res.json()["tls_terminated"] is False

@pytest.mark.asyncio
async def test_hsts_and_frame_options_security_headers(client: AsyncClient):
    res = await client.get("/api/v1/proxy/security-headers")
    assert res.status_code == 200
    assert res.json()["X-Frame-Options"] == "DENY"
    assert "max-age" in res.json()["Strict-Transport-Security"]
