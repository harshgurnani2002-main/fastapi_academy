from typing import Optional, List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.refresh_token import RefreshTokenModel
from src.repositories.base import BaseRepository


class TokenRepository(BaseRepository[RefreshTokenModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(RefreshTokenModel, session)

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshTokenModel]:
        stmt = select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_entire_family(self, family_id: str) -> int:
        """Revoke all tokens in a family upon detecting theft/reuse."""
        stmt = (
            update(RefreshTokenModel)
            .where(RefreshTokenModel.family_id == family_id)
            .values(is_revoked=True)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount or 0

    async def revoke_all_user_tokens(self, user_id: int) -> int:
        stmt = (
            update(RefreshTokenModel)
            .where(RefreshTokenModel.user_id == user_id)
            .values(is_revoked=True)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount or 0
