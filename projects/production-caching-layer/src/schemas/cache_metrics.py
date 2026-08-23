from pydantic import BaseModel


class CacheTelemetryResponse(BaseModel):
    l1_hits: int
    l2_hits: int
    negative_hits: int
    db_queries: int
    total_requests: int
    hit_ratio_percent: float
    estimated_latency_saved_ms: float
