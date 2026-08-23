from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.repositories.user_repo import UserRepository
from src.repositories.item_repo import ItemRepository
from src.services.user_service import UserService
from src.services.item_service import ItemService


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    """Dependency provider for UserRepository."""
    return UserRepository(session)


def get_item_repository(session: AsyncSession = Depends(get_db)) -> ItemRepository:
    """Dependency provider for ItemRepository."""
    return ItemRepository(session)


def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    """Dependency provider for UserService with UserRepository injected."""
    return UserService(user_repo)


def get_item_service(
    item_repo: ItemRepository = Depends(get_item_repository),
    user_repo: UserRepository = Depends(get_user_repository)
) -> ItemService:
    """Dependency provider for ItemService with repositories injected."""
    return ItemService(item_repo, user_repo)
