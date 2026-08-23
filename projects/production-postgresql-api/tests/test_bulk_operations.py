import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_bulk_insert_throughput(client: AsyncClient):
    org_res = await client.post("/api/v1/organizations", json={"name": "Bulk Org", "slug": "bulk-org"})
    org_id = org_res.json()["data"]["id"]

    proj_res = await client.post("/api/v1/projects", json={"org_id": org_id, "name": "Bulk Project", "code": "BULK"})
    project_id = proj_res.json()["data"]["id"]

    batch_payload = {
        "items": [
            {
                "project_id": project_id,
                "title": f"Batch Task #{i}",
                "status": "todo",
                "priority": 2
            }
            for i in range(50)
        ]
    }

    bulk_res = await client.post("/api/v1/bulk/tasks", json=batch_payload)
    assert bulk_res.status_code == 201
    assert bulk_res.json()["data"]["inserted_count"] == 50
