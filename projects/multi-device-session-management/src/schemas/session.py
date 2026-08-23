from pydantic import BaseModel, Field
from typing import Optional, List


class LoginRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    device_name: str = Field(default="Chrome on MacBook Pro", max_length=100)


class SessionOut(BaseModel):
    session_id: str
    user_id: str
    username: str
    device_name: str
    ip_address: str
    created_at: float
    last_active: float
    expires_at: float
    is_current_session: Optional[bool] = None


class ActiveSessionsList(BaseModel):
    total_active: int
    max_devices_allowed: int
    sessions: List[SessionOut]
