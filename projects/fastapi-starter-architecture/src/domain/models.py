from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class UserEntity:
    """Pure domain entity representing a User."""
    id: Optional[int]
    email: str
    username: str
    full_name: str
    is_active: bool = True
    is_superuser: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class ItemEntity:
    """Pure domain entity representing an Item/Product."""
    id: Optional[int]
    title: str
    description: str
    price: float
    owner_id: int
    is_published: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def validate_price(self) -> None:
        if self.price < 0:
            raise ValueError("Item price cannot be negative.")
