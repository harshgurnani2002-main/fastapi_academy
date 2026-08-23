import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_optimistic_concurrency_control(client: AsyncClient):
    org_res = await client.post("/api/v1/organizations", json={"name": "OCC Org", "slug": "occ-org"})
    org_id = org_res.json()["data"]["id"]

    proj_res = await client.post("/api/v1/projects", json={"org_id": org_id, "name": "OCC Project", "code": "OCC-01"})
    project_id = proj_res.json()["data"]["id"]

    # Update with correct version_id = 1 -> succeeds and bumps to version 2
    u1_res = await client.put(f"/api/v1/projects/{project_id}", json={
        "name": "OCC Project Renamed",
        "version_id": 1
    })
    assert u1_res.status_code == 200
    assert u1_res.json()["data"]["version_id"] == 2

    # Stale transaction attempting update with old version_id = 1 -> 409 Conflict
    stale_res = await client.put(f"/api/v1/projects/{project_id}", json={
        "name": "Stale Update Attempt",
        "version_id": 1
    })
    assert stale_res.status_code == 409
    assert stale_res.json()["error"]["code"] == "OPTIMISTIC_LOCK_CONFLICT"
