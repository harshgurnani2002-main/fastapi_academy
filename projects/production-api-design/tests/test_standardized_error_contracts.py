import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_standardized_error_response(client: AsyncClient):
    # Query non-existent ID -> 404 with structured JSON contract
    r = await client.get("/v2/customers/99999")
    assert r.status_code == 404
    err_body = r.json()
    assert err_body["success"] is False
    assert err_body["error"]["code"] == "RESOURCE_NOT_FOUND"
    assert "99999" in err_body["error"]["message"]
