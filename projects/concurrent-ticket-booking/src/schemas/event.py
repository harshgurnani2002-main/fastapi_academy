from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class EventCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    venue: str = Field(..., min_length=2, max_length=100)
    total_capacity: int = Field(..., ge=1, le=50000)
    ticket_price: float = Field(..., ge=0.0)


class EventOut(BaseModel):
    id: int
    title: str
    venue: str
    total_capacity: int
    available_tickets: int
    ticket_price: float
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
