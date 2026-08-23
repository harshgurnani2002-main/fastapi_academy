from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from src.models.ticket import TicketStatus


class TicketOut(BaseModel):
    id: int
    event_id: int
    seat_number: str
    status: TicketStatus
    price: float
    held_until: Optional[datetime] = None
    held_by_user: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TicketHoldRequest(BaseModel):
    seat_number: str = Field(..., min_length=1, max_length=20)
    user_email: EmailStr
    hold_duration_seconds: int = Field(default=600, ge=60, le=1800)
