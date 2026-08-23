import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tier_configuration_metadata(client: AsyncClient):
    res = await client.get("/api/v1/tiers/info")
    assert res.status_code == 200
    tiers = res.json()["data"]
    assert "anonymous" in tiers
    assert "authenticated" in tiers
    assert "enterprise_api" in tiers
    assert tiers["enterprise_api"]["limit"] == 600
