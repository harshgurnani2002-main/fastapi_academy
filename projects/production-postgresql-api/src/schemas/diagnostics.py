from pydantic import BaseModel
from typing import Dict, Any


class PoolDiagnosticsResponse(BaseModel):
    status: str = "healthy"
    pool_metrics: Dict[str, Any]
    query_latency_ms: float
    database_version: str
