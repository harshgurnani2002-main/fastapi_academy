from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from src.models.document import ClassificationLevel


class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    content: str = Field(..., min_length=1)
    classification: ClassificationLevel = ClassificationLevel.INTERNAL


class DocumentOut(BaseModel):
    id: int
    owner_id: int
    title: str
    content: str
    classification: ClassificationLevel
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
