from pydantic import BaseModel, Field
from typing import List, Dict, Any


class BurstSimulationRequest(BaseModel):
    identifier: str = "simulated_client_ip"
    algorithm: str = "token_bucket"
    limit: int = Field(default=5, ge=1, le=100)
    window_seconds: int = Field(default=60, ge=1, le=300)
    total_burst_requests: int = Field(default=15, ge=2, le=50)


class BurstSimulationResult(BaseModel):
    algorithm: str
    requests_sent: int
    accepted: int
    rejected_429: int
    rate_limit: int
    retry_after_seconds: int
    summary: str
