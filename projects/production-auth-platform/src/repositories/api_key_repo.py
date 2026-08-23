from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.api_key import ApiKeyModel
from src.repositories.base import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKeyModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(ApiKeyModel, session)

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKeyModel]:
        stmt = select(ApiKeyModel).where(ApiKeyModel.key_hash == key_hash, ApiKeyModel.is_active == True)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int) -> List[ApiKeyModel]:
        stmt = select(ApiKeyModel).where(ApiKeyModel.user_id == user_id).order_by(ApiKeyModel.id.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
