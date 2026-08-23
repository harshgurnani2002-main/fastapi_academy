import pytest
import asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_document_processing_lifecycle(client: AsyncClient):
    # 1. Enqueue task
    dispatch_res = await client.post("/api/v1/documents/process", json={
        "document_name": "quarterly_earnings_q3.pdf",
        "file_size_bytes": 250000,
        "operation": "OCR_AND_SUMMARIZE"
    })
    assert dispatch_res.status_code == 202
    task_id = dispatch_res.json()["data"]["task_id"]

    # 2. Wait for background worker processing completion
    await asyncio.sleep(0.15)

    # 3. Poll task status
    poll_res = await client.get(f"/api/v1/tasks/{task_id}/status")
    assert poll_res.status_code == 200
    task_data = poll_res.json()["data"]
    assert task_data["status"] == "SUCCESS"
    assert task_data["progress_percent"] == 100
    assert task_data["result"]["ocr_confidence"] == 0.985
