import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_and_correlation(client: AsyncClient):
    response = await client.get("/api/v1/resources")
    assert response.status_code == 200
    
    # Security Headers
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert "x-correlation-id" in response.headers
    assert "x-process-time" in response.headers
