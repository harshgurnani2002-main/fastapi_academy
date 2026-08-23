from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class OrderCreate(BaseModel):
    customer_email: str = Field(..., min_length=5)
    total_amount: float = Field(..., ge=0.01)
    items: List[Dict[str, Any]] = Field(default_factory=list)


class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_email: str
    total_amount: float
    status: str
