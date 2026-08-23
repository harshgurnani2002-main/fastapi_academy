from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.booking import BookingModel
from src.repositories.base import BaseRepository


class BookingRepository(BaseRepository[BookingModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(BookingModel, session)

    async def get_by_idempotency_key(self, key: str) -> Optional[BookingModel]:
        stmt = select(BookingModel).where(BookingModel.idempotency_key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
