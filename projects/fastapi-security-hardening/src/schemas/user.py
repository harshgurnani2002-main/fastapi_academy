from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Vulnerable schema allowing Mass Assignment (is_admin, role)
class UserCreateVulnerable(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: Optional[str] = "user"
    is_admin: Optional[bool] = False  # Attacker can supply {"is_admin": true}!


# Hardened schema strictly forbidding unprivileged privilege escalation
class UserCreateHardened(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=128)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    is_admin: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
