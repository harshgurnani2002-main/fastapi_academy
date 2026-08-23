import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_correlation_id_and_process_time_headers(client: AsyncClient):
    """Verify middleware injects X-Correlation-ID and X-Process-Time headers."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert "x-correlation-id" in response.headers
    assert "x-process-time" in response.headers

    # Verify custom correlation ID is preserved
    custom_cid = "custom-test-correlation-12345"
    response2 = await client.get("/api/v1/health", headers={"X-Correlation-ID": custom_cid})
    assert response2.headers["x-correlation-id"] == custom_cid
