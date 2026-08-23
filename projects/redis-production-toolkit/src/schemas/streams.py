from pydantic import BaseModel, Field
from typing import Dict, Any, List


class StreamEventPublish(BaseModel):
    stream_name: str = Field(..., min_length=1, max_length=100)
    event_type: str = Field(..., min_length=1, max_length=50)
    payload: Dict[str, Any] = Field(default_factory=dict)


class StreamEventOut(BaseModel):
    id: str
    fields: Dict[str, Any]


class StreamConsumeRequest(BaseModel):
    stream_name: str
    group_name: str = "workers"
    consumer_name: str = "worker-1"
    batch_size: int = Field(default=5, ge=1, le=100)


class StreamAckRequest(BaseModel):
    stream_name: str
    group_name: str
    message_ids: List[str]
