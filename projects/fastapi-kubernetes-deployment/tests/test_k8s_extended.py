import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ingress_rules(client: AsyncClient):
    res = await client.get("/api/v1/k8s/ingress")
    assert res.status_code == 200
    assert res.json()["hosts"] == ["api.enterprise.io"]
