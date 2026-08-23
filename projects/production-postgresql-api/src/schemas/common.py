from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = "Operation successful"
    data: Optional[T] = None


class CursorPaginatedResponse(BaseModel, Generic[T]):
    """
    Keyset / Cursor-based Pagination Envelope.
    Solves performance degradation and duplicate row shifting inherent in OFFSET pagination.
    """
    items: List[T]
    next_cursor: Optional[str] = Field(None, description="Opaque cursor token for next page")
    has_more: bool
    limit: int
