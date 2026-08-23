import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tenant_creation_and_user_addition(client: AsyncClient):
    # 1. Create new tenant
    t_res = await client.post("/api/v1/saas/tenants", json={
        "tenant_id": "org_startup_ai",
        "name": "Startup AI Inc",
        "tier": "ENTERPRISE"
    })
    assert t_res.status_code == 200
    assert t_res.json()["name"] == "Startup AI Inc"

    # 2. Add user to tenant
    u_res = await client.post("/api/v1/saas/tenants/org_startup_ai/users", json={
        "email": "cto@startup.ai",
        "role": "admin"
    })
    assert u_res.status_code == 200
    assert "cto@startup.ai" in u_res.json()["tenant"]["users"]
