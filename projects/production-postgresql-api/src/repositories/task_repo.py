"""
Task Repository with Keyset / Cursor Pagination & High-Throughput Bulk Operations
=================================================================================
Senior Design Note:
1. `paginate_cursor`: Standard `OFFSET` pagination scans and discards N prior rows (O(N) cost).
   Keyset pagination queries `WHERE (project_id, id) > (p_id, last_id) ORDER BY id ASC LIMIT M`
   which leverages the B-Tree index directly with O(log N) constant time efficiency.
2. `bulk_insert_tasks`: Leverages raw `session.execute(insert(TaskModel).values(...))` for 10x-50x
   throughput compared to individual ORM model instantiations.
"""

import base64
from typing import List, Optional, Tuple
from sqlalchemy import select, insert, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.task import TaskModel, TaskStatus
from src.repositories.base import BaseRepository


def decode_cursor(cursor_str: Optional[str]) -> Optional[int]:
    if not cursor_str:
        return None
    try:
        raw = base64.urlsafe_b64decode(cursor_str.encode("utf-8")).decode("utf-8")
        return int(raw)
    except Exception:
        return None


def encode_cursor(last_id: int) -> str:
    return base64.urlsafe_b64encode(str(last_id).encode("utf-8")).decode("utf-8")


class TaskRepository(BaseRepository[TaskModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(TaskModel, session)

    async def paginate_cursor(
        self,
        project_id: int,
        cursor: Optional[str],
        limit: int = 20,
        status: Optional[TaskStatus] = None
    ) -> Tuple[List[TaskModel], Optional[str], bool]:
        """
        Keyset cursor-based pagination over composite index (project_id, id).
        """
        last_id = decode_cursor(cursor)
        
        stmt = select(TaskModel).where(TaskModel.project_id == project_id)
        if status:
            stmt = stmt.where(TaskModel.status == status)
            
        if last_id is not None:
            stmt = stmt.where(TaskModel.id > last_id)
            
        stmt = stmt.order_by(TaskModel.id.asc()).limit(limit + 1)
        
        result = await self.session.execute(stmt)
        records = list(result.scalars().all())
        
        has_more = len(records) > limit
        items = records[:limit]
        
        next_cursor = None
        if has_more and items:
            next_cursor = encode_cursor(items[-1].id)
            
        return items, next_cursor, has_more

    async def bulk_insert_tasks(self, task_dicts: List[dict]) -> int:
        """Vectorized bulk insert skipping individual ORM instance overhead."""
        if not task_dicts:
            return 0
        stmt = insert(TaskModel).values(task_dicts)
        await self.session.execute(stmt)
        await self.session.flush()
        return len(task_dicts)
