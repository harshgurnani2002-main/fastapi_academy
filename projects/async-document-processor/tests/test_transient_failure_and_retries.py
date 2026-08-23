import pytest
import asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_transient_failure_exponential_backoff(client: AsyncClient):
    # Enqueue task with transient failure simulation
    dispatch_res = await client.post("/api/v1/documents/process", json={
        "document_name": "network_glitch_doc.pdf",
        "file_size_bytes": 80000,
        "simulate_transient_failure": True
    })
    assert dispatch_res.status_code == 202
    task_id = dispatch_res.json()["data"]["task_id"]

    # Allow time for worker failure + backoff retry + completion
    await asyncio.sleep(0.3)

    poll_res = await client.get(f"/api/v1/tasks/{task_id}/status")
    assert poll_res.status_code == 200
    task_data = poll_res.json()["data"]
    assert task_data["status"] == "SUCCESS"
    assert task_data["retry_count"] == 1
