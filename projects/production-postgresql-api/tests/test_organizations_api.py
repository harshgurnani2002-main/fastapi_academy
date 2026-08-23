import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_organization_lifecycle_and_slug_uniqueness(client: AsyncClient):
    payload = {
        "name": "Stripe Payments Inc",
        "slug": "stripe",
        "tier": "enterprise",
        "settings_json": {"features": ["audit_trail", "sso"]}
    }
    res1 = await client.post("/api/v1/organizations", json=payload)
    assert res1.status_code == 201
    assert res1.json()["data"]["slug"] == "stripe"

    # Duplicate slug must return 409 Conflict
    res2 = await client.post("/api/v1/organizations", json=payload)
    assert res2.status_code == 409
    assert res2.json()["error"]["code"] == "RESOURCE_CONFLICT"

    # Query by slug
    get_res = await client.get("/api/v1/organizations/stripe")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == "Stripe Payments Inc"
