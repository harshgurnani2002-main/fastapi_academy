from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from src.models.task import TaskStatus


class TaskCreate(BaseModel):
    project_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: TaskStatus = TaskStatus.TODO
    priority: int = Field(default=3, ge=1, le=5)
    due_date: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    assignee_email: Optional[EmailStr] = None


class TaskBatchCreate(BaseModel):
    items: List[TaskCreate] = Field(..., min_length=1, max_length=500)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None


class TaskOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: str
    status: TaskStatus
    priority: int
    due_date: Optional[datetime] = None
    tags: List[str]
    assignee_email: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
