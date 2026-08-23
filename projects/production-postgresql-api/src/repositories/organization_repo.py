from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.organization import OrganizationModel
from src.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[OrganizationModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(OrganizationModel, session)

    async def get_by_slug(self, slug: str) -> Optional[OrganizationModel]:
        stmt = select(OrganizationModel).where(OrganizationModel.slug == slug)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
