import hashlib
from typing import List, Optional, Tuple
from src.core.exceptions import ConflictException, NotFoundException
from src.domain.models import UserEntity
from src.repositories.user_repo import UserRepository
from src.schemas.user import UserCreate, UserUpdate


def hash_password(password: str) -> str:
    """Simple deterministic hashing for starter demonstration."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class UserService:
    """Service encapsulating user domain and business workflows."""
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, payload: UserCreate) -> UserEntity:
        if await self.user_repo.exists_by_email(payload.email):
            raise ConflictException(f"User with email '{payload.email}' already exists.")
        
        if await self.user_repo.exists_by_username(payload.username):
            raise ConflictException(f"User with username '{payload.username}' already exists.")

        model = await self.user_repo.create(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            is_active=payload.is_active,
            is_superuser=False
        )
        return self._to_entity(model)

    async def get_user_by_id(self, user_id: int) -> UserEntity:
        model = await self.user_repo.get_by_id(user_id)
        if not model:
            raise NotFoundException("User", user_id)
        return self._to_entity(model)

    async def list_users(self, page: int = 1, size: int = 20) -> Tuple[List[UserEntity], int]:
        offset = (page - 1) * size
        models = await self.user_repo.list(skip=offset, limit=size)
        total = await self.user_repo.count()
        return [self._to_entity(m) for m in models], total

    async def update_user(self, user_id: int, payload: UserUpdate) -> UserEntity:
        # Check existence
        await self.get_user_by_id(user_id)
        
        update_data = payload.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"]:
            existing = await self.user_repo.get_by_email(update_data["email"])
            if existing and existing.id != user_id:
                raise ConflictException(f"Email '{update_data['email']}' is already in use.")

        updated_model = await self.user_repo.update(user_id, **update_data)
        return self._to_entity(updated_model)

    async def delete_user(self, user_id: int) -> bool:
        await self.get_user_by_id(user_id)
        return await self.user_repo.delete(user_id)

    def _to_entity(self, model) -> UserEntity:
        return UserEntity(
            id=model.id,
            email=model.email,
            username=model.username,
            full_name=model.full_name,
            is_active=model.is_active,
            is_superuser=model.is_superuser,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
