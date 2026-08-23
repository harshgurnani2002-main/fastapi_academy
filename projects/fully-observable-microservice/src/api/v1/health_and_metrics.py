from fastapi import APIRouter, Response, HTTPException, Header
from typing import Optional
from src.core.telemetry import metrics_registry

router = APIRouter(tags=["Observability & Health Probes"])


@router.get("/metrics", summary="Prometheus Metrics Scrape Endpoint")
async def get_metrics():
    content = metrics_registry.generate_metrics_text()
    return Response(content=content, media_type="text/plain; version=0.0.4")


@router.get("/health/live", summary="Kubernetes Liveness Probe")
async def liveness():
    return {"status": "LIVE", "timestamp": 1771615000}


@router.get("/health/ready", summary="Kubernetes Readiness Probe")
async def readiness():
    return {
        "status": "READY",
        "dependencies": {
            "database": "UP",
            "redis": "UP",
            "broker": "UP"
        }
    }


@router.get("/api/v1/business/transaction", summary="Sample Observable Business Endpoint")
async def sample_transaction(x_correlation_id: Optional[str] = Header(None)):
    cid = x_correlation_id or "cid-auto-generated-123"
    return {"transaction_id": "tx-12345", "status": "COMPLETED", "correlation_id": cid}


@router.post("/api/v1/orders/simulate-error", summary="Simulate 500 Server Error to Test Prometheus RED Metrics")
async def simulate_error():
    raise HTTPException(status_code=500, detail="Simulated downstream dependency failure")
