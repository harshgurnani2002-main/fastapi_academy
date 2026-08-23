from pydantic import BaseModel, Field


class RateLimitCheckRequest(BaseModel):
    identifier: str = Field(..., description="User ID or IP address")
    limit: int = Field(default=5, ge=1, le=1000)
    window_ms: int = Field(default=60000, ge=1000, le=3600000)


class RateLimitCheckResponse(BaseModel):
    identifier: str
    is_allowed: bool
    remaining_tokens: int
    limit: int
    window_ms: int
