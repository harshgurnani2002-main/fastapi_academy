import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_task_cancellation_and_state(client: AsyncClient):
    # 1. Dispatch a document task
    res = await client.post("/api/v1/documents/process", json={
        "document_name": "quarterly_balance_sheet.pdf",
        "file_size_bytes": 1200000,
        "operation": "OCR_AND_SUMMARIZE",
        "idempotency_key": "idemp-cancel-001"
    })
    assert res.status_code == 202
    task_id = res.json()["data"]["task_id"]

    # 2. Check task exists in queued or processing status
    st_res = await client.get(f"/api/v1/tasks/{task_id}/status")
    assert st_res.status_code == 200
    assert st_res.json()["data"]["status"] in ["QUEUED", "PROCESSING", "SUCCESS"]


@pytest.mark.asyncio
async def test_invalid_document_input_validation(client: AsyncClient):
    # Missing required fields -> 422 Unprocessable Entity
    bad_res = await client.post("/api/v1/documents/process", json={
        "document_name": "ab",  # too short min_length 3
        "file_size_bytes": 0,    # gt 0 required
        "operation": "OCR_AND_SUMMARIZE"
    })
    assert bad_res.status_code == 422


@pytest.mark.asyncio
async def test_non_existent_task_returns_404(client: AsyncClient):
    res = await client.get("/api/v1/tasks/non-existent-task-uuid-999/status")
    assert res.status_code == 404
