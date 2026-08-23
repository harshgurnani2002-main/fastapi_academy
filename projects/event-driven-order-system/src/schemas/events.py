from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class OutboxRelayResponse(BaseModel):
    events_relayed: int
    stream_name: str
    event_ids: List[str]


class EventConsumeRequest(BaseModel):
    consumer_name: str = "payment_and_inventory_worker"
    stream_name: str = "stream:orders"


class EventConsumeResponse(BaseModel):
    events_processed: int
    duplicates_skipped: int
    consumer: str


class EventReplayRequest(BaseModel):
    stream_name: str = "stream:orders"
    from_timestamp_ms: Optional[int] = None
