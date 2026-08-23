import asyncio
from typing import Dict, List, Any
import time


class BankingLedger:
    def __init__(self):
        self.accounts: Dict[str, float] = {
            "acc_alice": 1000.0,
            "acc_bob": 1000.0,
            "acc_charlie": 1000.0
        }
        self.audit_trail: List[Dict[str, Any]] = []
        self._lock = asyncio.Lock()

    async def transfer(self, from_acc: str, to_acc: str, amount: float) -> bool:
        if amount <= 0:
            return False
        async with self._lock:
            if from_acc not in self.accounts or to_acc not in self.accounts:
                return False
            if self.accounts[from_acc] < amount:
                return False
            
            self.accounts[from_acc] -= amount
            self.accounts[to_acc] += amount
            self.audit_trail.append({
                "timestamp": time.time(),
                "action": "TRANSFER",
                "from": from_acc,
                "to": to_acc,
                "amount": amount
            })
            return True

    async def create_account(self, account_id: str, initial_balance: float = 0.0) -> bool:
        async with self._lock:
            if account_id in self.accounts:
                return False
            self.accounts[account_id] = initial_balance
            self.audit_trail.append({
                "timestamp": time.time(),
                "action": "CREATE_ACCOUNT",
                "account": account_id,
                "balance": initial_balance
            })
            return True

    def total_vault_balance(self) -> float:
        return sum(self.accounts.values())

    def reset(self):
        self.accounts = {
            "acc_alice": 1000.0,
            "acc_bob": 1000.0,
            "acc_charlie": 1000.0
        }
        self.audit_trail.clear()


ledger = BankingLedger()
