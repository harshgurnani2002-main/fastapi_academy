import hashlib
import secrets
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.api_key import ApiKeyModel
from src.repositories.api_key_repo import ApiKeyRepository
from src.schemas.api_key import ApiKeyCreateRequest, ApiKeyCreatedResponse


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class ApiKeyService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.api_key_repo = ApiKeyRepository(session)

    async def create_key(self, user_id: int, payload: ApiKeyCreateRequest) -> ApiKeyCreatedResponse:
        prefix = f"ak_live_{secrets.token_hex(4)}"
        secret = secrets.token_urlsafe(32)
        raw_key = f"{prefix}_{secret}"

        model = await self.api_key_repo.create(
            user_id=user_id,
            name=payload.name,
            key_prefix=prefix,
            key_hash=hash_api_key(raw_key),
            scopes=payload.scopes,
            is_active=True
        )

        return ApiKeyCreatedResponse(
            id=model.id,
            name=model.name,
            raw_api_key=raw_key,
            key_prefix=prefix,
            scopes=model.scopes
        )

    async def verify_key(self, raw_key: str) -> Optional[ApiKeyModel]:
        key_h = hash_api_key(raw_key)
        return await self.api_key_repo.get_by_hash(key_h)

    async def list_keys(self, user_id: int) -> List[ApiKeyModel]:
        return await self.api_key_repo.list_by_user(user_id)
