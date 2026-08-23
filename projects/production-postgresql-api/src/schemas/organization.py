from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from src.models.organization import OrgTier


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=50, pattern="^[a-z0-9-]+$")
    tier: OrgTier = OrgTier.PRO
    settings_json: Dict[str, Any] = Field(default_factory=dict)


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    tier: Optional[OrgTier] = None
    settings_json: Optional[Dict[str, Any]] = None


class OrganizationOut(BaseModel):
    id: int
    name: str
    slug: str
    tier: OrgTier
    settings_json: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
