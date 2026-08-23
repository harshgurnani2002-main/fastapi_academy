from typing import List, Tuple
from src.core.exceptions import ConflictException, NotFoundException
from src.core.security import hash_password
from src.models.user import UserModel, UserRole
from src.repositories.user_repo import UserRepository
from src.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, payload: UserCreate) -> UserModel:
        if await self.user_repo.get_by_email(payload.email):
            raise ConflictException(f"User with email '{payload.email}' already exists.")
        if await self.user_repo.get_by_username(payload.username):
            raise ConflictException(f"Username '{payload.username}' is already taken.")

        return await self.user_repo.create(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            is_active=True,
            is_verified=False
        )

    async def get_by_id(self, user_id: int) -> UserModel:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User", user_id)
        return user

    async def list_users(self, page: int = 1, size: int = 20) -> Tuple[List[UserModel], int]:
        offset = (page - 1) * size
        users = await self.user_repo.list(skip=offset, limit=size)
        total = await self.user_repo.count()
        return users, total

    async def update_user(self, user_id: int, payload: UserUpdate) -> UserModel:
        await self.get_by_id(user_id)
        update_data = payload.model_dump(exclude_unset=True)
        return await self.user_repo.update(user_id, **update_data)
