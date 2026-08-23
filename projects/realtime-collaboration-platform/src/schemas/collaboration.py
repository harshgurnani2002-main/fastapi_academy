from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class RoomBroadcastRequest(BaseModel):
    event_type: str = Field(default="CURSOR_UPDATE", description="CURSOR_UPDATE, DOCUMENT_DELTA, CHAT_MESSAGE")
    payload: Dict[str, Any] = Field(default_factory=dict)
    sender_id: str = Field(default="system_broadcaster")


class UserPresence(BaseModel):
    user_id: str
    username: str
    joined_at: float
    last_seen: float


class RoomPresenceResponse(BaseModel):
    room_id: str
    total_active_users: int
    users: List[UserPresence]
