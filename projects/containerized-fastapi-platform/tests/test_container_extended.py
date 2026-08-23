import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_security_audit_non_root(client: AsyncClient):
    res = await client.get("/api/v1/container/security-audit")
    assert res.status_code == 200
    data = res.json()
    assert data["is_root"] is False
    assert "ALL" in data["drop_capabilities"]
