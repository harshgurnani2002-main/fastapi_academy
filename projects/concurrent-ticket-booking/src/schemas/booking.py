from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from src.models.booking import BookingStatus


class BookingCreateRequest(BaseModel):
    event_id: int = Field(..., gt=0)
    seat_number: str = Field(..., min_length=1, max_length=20)
    customer_email: EmailStr


class BookingOut(BaseModel):
    id: int
    event_id: int
    seat_number: str
    customer_email: str
    amount_paid: float
    status: BookingStatus
    idempotency_key: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
