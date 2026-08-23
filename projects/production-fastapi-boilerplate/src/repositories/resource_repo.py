from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.resource import ResourceModel, ResourceStatus
from src.repositories.base import BaseRepository


class ResourceRepository(BaseRepository[ResourceModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(ResourceModel, session)

    async def list_by_owner(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[ResourceModel]:
        stmt = select(ResourceModel).where(ResourceModel.owner_id == owner_id).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_status(self, status: ResourceStatus, skip: int = 0, limit: int = 100) -> List[ResourceModel]:
        stmt = select(ResourceModel).where(ResourceModel.status == status).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_status(self, status: ResourceStatus) -> int:
        stmt = select(func.count(ResourceModel.id)).where(ResourceModel.status == status)
        result = await self.session.execute(stmt)
        return result.scalar_one() or 0
