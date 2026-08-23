from pydantic import BaseModel, Field


class LockAcquireRequest(BaseModel):
    resource_id: str = Field(..., min_length=1, max_length=100)
    ttl_seconds: int = Field(default=10, ge=1, le=60)


class LockAcquireResponse(BaseModel):
    resource_id: str
    lock_key: str
    token: str
    ttl_seconds: int
    acquired: bool


class LockReleaseRequest(BaseModel):
    resource_id: str
    token: str


class CriticalWorkRequest(BaseModel):
    resource_id: str
    duration_ms: int = Field(default=100, ge=10, le=5000)
