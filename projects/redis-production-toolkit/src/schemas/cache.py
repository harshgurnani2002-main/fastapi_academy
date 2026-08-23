from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class CacheSetRequest(BaseModel):
    key: str = Field(..., min_length=1, max_length=200)
    value: Any = Field(..., description="JSON-serializable data payload")
    ttl_seconds: Optional[int] = Field(default=300, ge=1, le=86400)


class CacheEntryResponse(BaseModel):
    key: str
    value: Any
    ttl_remaining: int
    is_cached: bool = True


class CacheStatsResponse(BaseModel):
    hits: int
    misses: int
    hit_ratio: float
    total_keys: int
