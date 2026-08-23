from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.models import ItemModel
from src.repositories.base import BaseRepository


class ItemRepository(BaseRepository[ItemModel]):
    """Repository handling Item persistence operations."""
    def __init__(self, session: AsyncSession):
        super().__init__(ItemModel, session)

    async def list_by_owner(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[ItemModel]:
        stmt = select(ItemModel).where(ItemModel.owner_id == owner_id).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_published(self, skip: int = 0, limit: int = 100) -> List[ItemModel]:
        stmt = select(ItemModel).where(ItemModel.is_published == True).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_published(self) -> int:
        stmt = select(func.count(ItemModel.id)).where(ItemModel.is_published == True)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0
