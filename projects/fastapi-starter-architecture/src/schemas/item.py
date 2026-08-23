from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    price: float = Field(..., ge=0.0, description="Item price in USD")
    is_published: bool = True


class ItemCreate(ItemBase):
    owner_id: int = Field(..., gt=0, description="ID of the user who owns this item")


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    price: Optional[float] = Field(None, ge=0.0)
    is_published: Optional[bool] = None


class ItemResponse(ItemBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
