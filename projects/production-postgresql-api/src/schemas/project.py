from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from src.models.project import ProjectStatus
from src.schemas.task import TaskOut


class ProjectCreate(BaseModel):
    org_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=20, pattern="^[A-Z0-9_-]+$")
    status: ProjectStatus = ProjectStatus.ACTIVE
    priority: int = Field(default=1, ge=1, le=5)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    status: Optional[ProjectStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    version_id: int = Field(..., description="Expected current version for OCC validation")


class ProjectOut(BaseModel):
    id: int
    org_id: int
    name: str
    code: str
    status: ProjectStatus
    priority: int
    version_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectDetailOut(ProjectOut):
    tasks: List[TaskOut] = Field(default_factory=list)
