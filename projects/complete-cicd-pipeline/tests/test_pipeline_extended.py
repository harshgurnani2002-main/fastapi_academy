import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pipeline_stages_and_trigger(client: AsyncClient):
    # Stages list
    st_res = await client.get("/api/v1/pipeline/stages")
    assert st_res.status_code == 200
    assert len(st_res.json()["stages"]) == 6

    # Trigger run
    tr_res = await client.post("/api/v1/pipeline/trigger-run", json={
        "branch": "feature/auth-v2",
        "commit_sha": "a1b2c3d4e5"
    })
    assert tr_res.status_code == 200
    assert tr_res.json()["status"] == "QUEUED"
