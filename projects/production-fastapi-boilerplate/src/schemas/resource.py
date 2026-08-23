from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from src.models.resource import ResourceStatus


class ResourceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="general", max_length=50)
    status: ResourceStatus = ResourceStatus.ACTIVE


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = None
    status: Optional[ResourceStatus] = None


class ResourceOut(ResourceBase):
    id: int
    owner_id: int
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ResourceOutV2(ResourceOut):
    is_deprecated: bool = False
    audit_tag: str = "v2-verified"
