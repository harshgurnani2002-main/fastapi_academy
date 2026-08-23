from typing import List, Optional, Tuple
from src.core.exceptions import NotFoundException, ValidationException
from src.domain.models import ItemEntity
from src.repositories.item_repo import ItemRepository
from src.repositories.user_repo import UserRepository
from src.schemas.item import ItemCreate, ItemUpdate


class ItemService:
    """Service encapsulating item catalog business logic."""
    def __init__(self, item_repo: ItemRepository, user_repo: UserRepository):
        self.item_repo = item_repo
        self.user_repo = user_repo

    async def create_item(self, payload: ItemCreate) -> ItemEntity:
        # Verify owner exists
        owner = await self.user_repo.get_by_id(payload.owner_id)
        if not owner:
            raise NotFoundException("User", payload.owner_id)

        if payload.price < 0:
            raise ValidationException("Item price cannot be negative.")

        model = await self.item_repo.create(
            title=payload.title,
            description=payload.description,
            price=payload.price,
            owner_id=payload.owner_id,
            is_published=payload.is_published
        )
        return self._to_entity(model)

    async def get_item_by_id(self, item_id: int) -> ItemEntity:
        model = await self.item_repo.get_by_id(item_id)
        if not model:
            raise NotFoundException("Item", item_id)
        return self._to_entity(model)

    async def list_items(
        self,
        page: int = 1,
        size: int = 20,
        published_only: bool = False
    ) -> Tuple[List[ItemEntity], int]:
        offset = (page - 1) * size
        if published_only:
            models = await self.item_repo.list_published(skip=offset, limit=size)
            total = await self.item_repo.count_published()
        else:
            models = await self.item_repo.list(skip=offset, limit=size)
            total = await self.item_repo.count()
        return [self._to_entity(m) for m in models], total

    async def update_item(self, item_id: int, payload: ItemUpdate) -> ItemEntity:
        await self.get_item_by_id(item_id)
        update_data = payload.model_dump(exclude_unset=True)
        if "price" in update_data and update_data["price"] is not None and update_data["price"] < 0:
            raise ValidationException("Item price cannot be negative.")

        updated_model = await self.item_repo.update(item_id, **update_data)
        return self._to_entity(updated_model)

    async def delete_item(self, item_id: int) -> bool:
        await self.get_item_by_id(item_id)
        return await self.item_repo.delete(item_id)

    def _to_entity(self, model) -> ItemEntity:
        return ItemEntity(
            id=model.id,
            title=model.title,
            description=model.description,
            price=model.price,
            owner_id=model.owner_id,
            is_published=model.is_published,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
