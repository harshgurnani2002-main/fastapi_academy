from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    scopes: List[str] = Field(default_factory=lambda: ["read"])


class ApiKeyCreatedResponse(BaseModel):
    id: int
    name: str
    raw_api_key: str = Field(..., description="Copy now! Will never be shown again.")
    key_prefix: str
    scopes: List[str]


class ApiKeyOut(BaseModel):
    id: int
    name: str
    key_prefix: str
    scopes: List[str]
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
