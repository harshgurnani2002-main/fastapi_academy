import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ssl_info_and_security_headers(client: AsyncClient):
    sec = await client.get("/api/v1/proxy/security-headers")
    assert sec.status_code == 200
    assert sec.json()["X-Frame-Options"] == "DENY"

    ssl = await client.get("/api/v1/proxy/ssl-info")
    assert ssl.status_code == 200
    assert "TLSv1.3" in ssl.json()["ssl_protocols"]
