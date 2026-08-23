import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_keyset_cursor_pagination(client: AsyncClient):
    org_res = await client.post("/api/v1/organizations", json={"name": "Keyset Org", "slug": "keyset-org"})
    org_id = org_res.json()["data"]["id"]

    proj_res = await client.post("/api/v1/projects", json={
        "org_id": org_id,
        "name": "Keyset Project",
        "code": "KEYSET"
    })
    project_id = proj_res.json()["data"]["id"]

    # Insert 15 tasks
    for i in range(1, 16):
        await client.post("/api/v1/tasks", json={
            "project_id": project_id,
            "title": f"Task Item #{i:02d}",
            "status": "todo",
            "priority": 3
        })

    # Page 1 (limit 5)
    page1_res = await client.get(f"/api/v1/tasks?project_id={project_id}&limit=5")
    assert page1_res.status_code == 200
    p1 = page1_res.json()["data"]
    assert len(p1["items"]) == 5
    assert p1["has_more"] is True
    assert p1["next_cursor"] is not None

    # Page 2 using next_cursor
    page2_res = await client.get(f"/api/v1/tasks?project_id={project_id}&limit=5&cursor={p1['next_cursor']}")
    assert page2_res.status_code == 200
    p2 = page2_res.json()["data"]
    assert len(p2["items"]) == 5
    assert p2["items"][0]["title"] == "Task Item #06"
