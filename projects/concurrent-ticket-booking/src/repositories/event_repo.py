"""
Event Repository with Row-Level Locking (SELECT ... FOR UPDATE)
==============================================================
Senior Design Note:
`with_for_update()` places an exclusive row-level lock on the event record during
inventory modification. Concurrent transactions reading the same row will wait until
the locking transaction commits or rolls back, guaranteeing zero overselling.
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.event import EventModel
from src.repositories.base import BaseRepository


class EventRepository(BaseRepository[EventModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(EventModel, session)

    async def get_for_update(self, event_id: int) -> Optional[EventModel]:
        """Pessimistic lock on Event row."""
        stmt = select(EventModel).where(EventModel.id == event_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
