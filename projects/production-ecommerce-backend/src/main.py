from fastapi import FastAPI
from pydantic import BaseModel
from src.core.saga_orchestrator import saga

app = FastAPI(title="Production E-Commerce Microservices", version="23.0.0")

class CheckoutRequest(BaseModel):
    order_id: str
    item_sku: str
    amount: float
    simulate_payment_failure: bool = False

class ReplenishRequest(BaseModel):
    item_sku: str
    quantity: int

@app.post("/api/v1/checkout/saga")
async def checkout(payload: CheckoutRequest):
    res = await saga.execute_order_saga(
        order_id=payload.order_id,
        item_sku=payload.item_sku,
        amount=payload.amount,
        should_fail_payment=payload.simulate_payment_failure
    )
    return {"data": res}

@app.get("/api/v1/inventory/stock")
async def get_stock():
    return {"inventory": saga.inventory_stock}

@app.post("/api/v1/inventory/replenish")
async def replenish_stock(payload: ReplenishRequest):
    saga.inventory_stock[payload.item_sku] = saga.inventory_stock.get(payload.item_sku, 0) + payload.quantity
    return {"message": "Stock replenished", "inventory": saga.inventory_stock}
