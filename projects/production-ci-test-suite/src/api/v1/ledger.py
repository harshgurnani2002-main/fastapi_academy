from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from src.core.banking_ledger import ledger

router = APIRouter(prefix="/ledger", tags=["Banking Ledger Invariants"])


class TransferRequest(BaseModel):
    from_account: str
    to_account: str
    amount: float = Field(..., gt=0)


class CreateAccountRequest(BaseModel):
    account_id: str = Field(..., min_length=3)
    initial_balance: float = Field(default=0.0, ge=0.0)


@router.post("/transfer", summary="Execute Atomic Financial Transfer")
async def execute_transfer(payload: TransferRequest):
    success = await ledger.transfer(payload.from_account, payload.to_account, payload.amount)
    if not success:
        raise HTTPException(status_code=400, detail="Transfer failed due to insufficient funds or invalid account.")
    return {
        "success": True,
        "from_balance": ledger.accounts[payload.from_account],
        "to_balance": ledger.accounts[payload.to_account]
    }


@router.post("/accounts", summary="Create New Bank Account")
async def create_account(payload: CreateAccountRequest):
    success = await ledger.create_account(payload.account_id, payload.initial_balance)
    if not success:
        raise HTTPException(status_code=400, detail="Account already exists.")
    return {
        "success": True,
        "account_id": payload.account_id,
        "balance": payload.initial_balance
    }


@router.get("/accounts", summary="Get Current Vault Balances")
async def get_balances():
    return {
        "accounts": ledger.accounts,
        "total_vault": ledger.total_vault_balance()
    }


@router.get("/audit-trail", summary="Inspect Complete Financial Audit Trail")
async def get_audit():
    return {
        "audit_count": len(ledger.audit_trail),
        "events": ledger.audit_trail
    }
