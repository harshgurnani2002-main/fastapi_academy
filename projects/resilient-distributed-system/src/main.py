from fastapi import FastAPI, HTTPException
from src.core.circuit_breaker import cb, CircuitState
import asyncio

app = FastAPI(title="Resilient Distributed System", version="22.0.0")

FAILURE_MODE = False
BULKHEAD_SEMAPHORE = asyncio.Semaphore(5)

@app.post("/api/v1/chaos/toggle-failure")
async def toggle_failure(enable: bool):
    global FAILURE_MODE
    FAILURE_MODE = enable
    return {"failure_mode_enabled": FAILURE_MODE}

@app.get("/api/v1/resilient/circuit-state")
async def get_circuit_state():
    return {
        "state": cb.state.value,
        "failure_count": cb.failure_count,
        "threshold": cb.failure_threshold
    }

@app.get("/api/v1/resilient/service-call")
async def call_downstream():
    async def downstream_work():
        if FAILURE_MODE:
            raise ConnectionError("Downstream DB connection timed out.")
        return {"status": "SUCCESS", "data": "Payment processed"}

    try:
        data = await cb.call(downstream_work)
        return {"circuit_state": cb.state.value, "result": data}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"circuit_state": cb.state.value, "error": str(e)})

@app.post("/api/v1/resilient/bulkhead")
async def bulkhead_call():
    if BULKHEAD_SEMAPHORE.locked():
        raise HTTPException(status_code=429, detail="Bulkhead capacity saturated")
    async with BULKHEAD_SEMAPHORE:
        return {"status": "EXECUTED", "available_slots": BULKHEAD_SEMAPHORE._value}
