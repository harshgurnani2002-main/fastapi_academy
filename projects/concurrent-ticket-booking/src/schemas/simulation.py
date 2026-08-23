from pydantic import BaseModel, Field
from typing import List, Dict, Any


class RaceConditionSimulationRequest(BaseModel):
    event_id: int = Field(..., gt=0)
    concurrent_buyers: int = Field(default=20, ge=2, le=50)
    mode: str = Field(default="pessimistic_lock", description="'pessimistic_lock' or 'unsafe'")


class RaceConditionSimulationResult(BaseModel):
    mode: str
    concurrent_requests_sent: int
    successful_bookings: int
    failed_due_to_conflict: int
    oversold_count: int
    remaining_tickets_in_db: int
    execution_time_ms: float
    summary: str
