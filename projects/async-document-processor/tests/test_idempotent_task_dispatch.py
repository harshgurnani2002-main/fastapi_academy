import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_idempotent_task_deduplication(client: AsyncClient):
    payload = {
        "document_name": "contract_nda_2026.pdf",
        "file_size_bytes": 120000,
        "idempotency_key": "unique-idemp-key-999"
    }

    # Dispatch 1
    r1 = await client.post("/api/v1/documents/process", json=payload)
    assert r1.status_code == 202
    task_id_1 = r1.json()["data"]["task_id"]

    # Dispatch 2 with same idempotency key
    r2 = await client.post("/api/v1/documents/process", json=payload)
    assert r2.status_code == 202
    task_id_2 = r2.json()["data"]["task_id"]

    # Both dispatches return the exact same task ID
    assert task_id_1 == task_id_2
