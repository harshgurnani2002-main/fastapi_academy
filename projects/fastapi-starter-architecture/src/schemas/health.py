from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Dict, Any


class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Service health state")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: str
    environment: str


class ReadinessResponse(BaseModel):
    status: str = "ready"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    checks: Dict[str, str] = Field(default_factory=dict)
