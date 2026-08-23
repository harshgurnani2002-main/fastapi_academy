from pydantic import BaseModel, Field
from typing import Any


class PublishMessageRequest(BaseModel):
    channel: str = Field(..., min_length=1, max_length=100)
    message: Any = Field(..., description="Message payload to broadcast")


class PublishMessageResponse(BaseModel):
    channel: str
    subscribers_reached: int
