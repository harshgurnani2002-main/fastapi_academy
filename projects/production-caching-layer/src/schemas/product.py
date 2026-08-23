from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=1)
    price: float = Field(..., ge=0.0)
    stock_quantity: int = Field(default=0, ge=0)
    category: str = Field(..., min_length=2, max_length=50)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    description: str
    price: float
    stock_quantity: int
    category: str
    cache_source: Optional[str] = None  # "L1_MEMORY", "L2_REDIS", "DATABASE"
    latency_ms: Optional[float] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
