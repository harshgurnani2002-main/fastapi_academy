from pydantic import BaseModel, Field
from typing import Optional


class RateLimitEvalRequest(BaseModel):
    identifier: str = Field(..., min_length=1)
    algorithm: str = Field(default="sliding_window", description="'sliding_window', 'token_bucket', or 'fixed_window'")
    limit: int = Field(default=10, ge=1, le=1000)
    window_seconds: int = Field(default=60, ge=1, le=3600)
    cost: int = Field(default=1, ge=1)


class RateLimitEvalResponse(BaseModel):
    identifier: str
    algorithm: str
    is_allowed: bool
    limit: int
    remaining: int
    reset_epoch: int
    retry_after_seconds: int
