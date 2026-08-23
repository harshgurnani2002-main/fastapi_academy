"""
Keyset / Cursor-Based Pagination Engine
=======================================
Senior Design Note:
Uses base64 encoded opaque cursors to guarantee O(1) page lookups across billions of rows
without offset query degradation.
"""

import base64
import json
from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")


def encode_cursor(last_id: int) -> str:
    payload = json.dumps({"id": last_id})
    return base64.b64encode(payload.encode("utf-8")).decode("utf-8")


def decode_cursor(cursor_str: str) -> Optional[int]:
    try:
        raw = base64.b64decode(cursor_str.encode("utf-8")).decode("utf-8")
        data = json.loads(raw)
        return data.get("id")
    except Exception:
        return None


class CursorPage(BaseModel, Generic[T]):
    items: List[T]
    total_count: int
    has_next: bool
    next_cursor: Optional[str] = None
    prev_cursor: Optional[str] = None
