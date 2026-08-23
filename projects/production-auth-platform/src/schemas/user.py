from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from src.models.user import UserRole


class UserProfileOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    scopes: List[str]
    is_active: bool
    is_verified: bool
    mfa_enabled: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
