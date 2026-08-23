import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_circuit_state_and_bulkhead(client: AsyncClient):
    st_res = await client.get("/api/v1/resilient/circuit-state")
    assert st_res.status_code == 200
    assert st_res.json()["state"] == "CLOSED"

    bh_res = await client.post("/api/v1/resilient/bulkhead")
    assert bh_res.status_code == 200
    assert bh_res.json()["status"] == "EXECUTED"
