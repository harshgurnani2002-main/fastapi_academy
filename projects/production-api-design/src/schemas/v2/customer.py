from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class CustomerV2Create(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., min_length=5)
    phone: Optional[str] = None
    tier: str = Field(default="standard", description="standard, gold, enterprise")


class CustomerV2Update(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    tier: Optional[str] = None


class CustomerV2Out(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    tier: str = "standard"
    metadata: Dict[str, Any] = Field(default_factory=dict)
