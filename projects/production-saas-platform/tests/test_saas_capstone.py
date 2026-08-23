import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_capstone_liveness_and_summary(client: AsyncClient):
    res = await client.get("/health/live")
    assert res.status_code == 200
    assert res.json()["capstone_ready"] is True

    t_res = await client.get("/api/v1/saas/tenant/summary?tenant_id=org_acme_corp")
    assert t_res.status_code == 200
    assert t_res.json()["subscription_tier"] == "ENTERPRISE"

@pytest.mark.asyncio
async def test_tenant_not_found_returns_404(client: AsyncClient):
    res = await client.get("/api/v1/saas/tenant/summary?tenant_id=org_non_existent")
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_duplicate_tenant_registration_fails(client: AsyncClient):
    res = await client.post("/api/v1/saas/tenants", json={
        "tenant_id": "org_acme_corp",
        "name": "Acme Corp Duplicate"
    })
    assert res.status_code == 400
