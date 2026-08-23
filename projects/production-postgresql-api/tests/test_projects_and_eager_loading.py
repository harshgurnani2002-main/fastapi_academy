import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_project_composite_code_constraint_and_eager_loading(client: AsyncClient):
    # 1. Create Org
    org_res = await client.post("/api/v1/organizations", json={
        "name": "Acme Corp",
        "slug": "acme",
        "tier": "pro"
    })
    org_id = org_res.json()["data"]["id"]

    # 2. Create Project
    proj_payload = {
        "org_id": org_id,
        "name": "Core Banking API",
        "code": "BANK-01",
        "status": "active",
        "priority": 1
    }
    p_res1 = await client.post("/api/v1/projects", json=proj_payload)
    assert p_res1.status_code == 201
    project_id = p_res1.json()["data"]["id"]

    # 3. Duplicate code in same org -> 409 Conflict
    p_res2 = await client.post("/api/v1/projects", json=proj_payload)
    assert p_res2.status_code == 409

    # 4. Create child tasks
    await client.post("/api/v1/tasks", json={
        "project_id": project_id,
        "title": "Setup OAuth2 Security",
        "status": "in_progress"
    })
    await client.post("/api/v1/tasks", json={
        "project_id": project_id,
        "title": "Configure Connection Pool",
        "status": "completed"
    })

    # 5. Eagerly load project with tasks in single query (selectinload)
    eager_res = await client.get(f"/api/v1/projects/{project_id}?include_tasks=true")
    assert eager_res.status_code == 200
    data = eager_res.json()["data"]
    assert "tasks" in data
    assert len(data["tasks"]) == 2
