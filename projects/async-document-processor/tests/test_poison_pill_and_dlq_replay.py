import pytest
import asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_poison_pill_sent_to_dlq_and_replayed(client: AsyncClient):
    # 1. Enqueue poison pill task
    p_res = await client.post("/api/v1/documents/process", json={
        "document_name": "corrupt_zero_byte.bin",
        "file_size_bytes": 500,
        "simulate_poison_pill": True
    })
    assert p_res.status_code == 202
    task_id = p_res.json()["data"]["task_id"]

    await asyncio.sleep(0.1)

    # 2. Verify task is in Dead Letter Queue (DLQ)
    dlq_res = await client.get("/api/v1/dlq/messages")
    assert dlq_res.status_code == 200
    dlq_tasks = dlq_res.json()["data"]
    assert any(t["task_id"] == task_id for t in dlq_tasks)

    # 3. Replay DLQ task
    replay_res = await client.post(f"/api/v1/dlq/{task_id}/replay")
    assert replay_res.status_code == 200

    # 4. Wait for re-driven execution
    await asyncio.sleep(0.15)
    poll_after = await client.get(f"/api/v1/tasks/{task_id}/status")
    assert poll_after.status_code == 200
    assert poll_after.json()["data"]["status"] == "SUCCESS"
