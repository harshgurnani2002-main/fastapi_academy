import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_account_creation_and_audit_trail(client: AsyncClient):
    # 1. Create account
    c_res = await client.post("/api/v1/ledger/accounts", json={
        "account_id": "acc_diana",
        "initial_balance": 500.0
    })
    assert c_res.status_code == 200
    assert c_res.json()["account_id"] == "acc_diana"

    # 2. Transfer from diana to bob
    t_res = await client.post("/api/v1/ledger/transfer", json={
        "from_account": "acc_diana",
        "to_account": "acc_bob",
        "amount": 200.0
    })
    assert t_res.status_code == 200

    # 3. Check audit trail
    a_res = await client.get("/api/v1/ledger/audit-trail")
    assert a_res.status_code == 200
    assert a_res.json()["audit_count"] >= 2


@pytest.mark.asyncio
async def test_duplicate_account_creation_rejected(client: AsyncClient):
    # Existing account acc_alice -> 400
    res = await client.post("/api/v1/ledger/accounts", json={
        "account_id": "acc_alice",
        "initial_balance": 100.0
    })
    assert res.status_code == 400
