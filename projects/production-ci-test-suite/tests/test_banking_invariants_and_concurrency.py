import pytest
import asyncio
from httpx import AsyncClient
from src.core.banking_ledger import ledger


@pytest.mark.asyncio
async def test_concurrent_transfers_preserve_conservation_of_money(client: AsyncClient):
    initial_total = ledger.total_vault_balance()  # 3000.0

    # Fire 50 concurrent transfers across accounts
    async def transfer_task(from_acc: str, to_acc: str, amt: float):
        await client.post("/api/v1/ledger/transfer", json={
            "from_account": from_acc,
            "to_account": to_acc,
            "amount": amt
        })

    tasks = []
    for _ in range(25):
        tasks.append(transfer_task("acc_alice", "acc_bob", 10.0))
        tasks.append(transfer_task("acc_bob", "acc_charlie", 5.0))

    await asyncio.gather(*tasks)

    # Invariant Check: Total vault balance MUST be preserved exactly
    final_total = ledger.total_vault_balance()
    assert final_total == initial_total == 3000.0


@pytest.mark.asyncio
async def test_insufficient_funds_rejection(client: AsyncClient):
    res = await client.post("/api/v1/ledger/transfer", json={
        "from_account": "acc_alice",
        "to_account": "acc_bob",
        "amount": 50000.0  # exceeds balance
    })
    assert res.status_code == 400
