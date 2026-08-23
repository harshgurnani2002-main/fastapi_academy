from typing import List, Optional, Tuple
from src.core.exceptions import NotFoundException, ForbiddenException
from src.models.resource import ResourceModel, ResourceStatus
from src.models.user import UserModel, UserRole
from src.repositories.resource_repo import ResourceRepository
from src.schemas.resource import ResourceCreate, ResourceUpdate


class ResourceService:
    def __init__(self, resource_repo: ResourceRepository):
        self.resource_repo = resource_repo

    async def create_resource(self, payload: ResourceCreate, current_user: UserModel) -> ResourceModel:
        return await self.resource_repo.create(
            title=payload.title,
            description=payload.description,
            category=payload.category,
            status=payload.status,
            owner_id=current_user.id,
            version=1
        )

    async def get_resource(self, resource_id: int) -> ResourceModel:
        res = await self.resource_repo.get_by_id(resource_id)
        if not res:
            raise NotFoundException("Resource", resource_id)
        return res

    async def list_resources(
        self,
        page: int = 1,
        size: int = 20,
        status: Optional[ResourceStatus] = None
    ) -> Tuple[List[ResourceModel], int]:
        offset = (page - 1) * size
        if status:
            items = await self.resource_repo.list_by_status(status, skip=offset, limit=size)
            total = await self.resource_repo.count_by_status(status)
        else:
            items = await self.resource_repo.list(skip=offset, limit=size)
            total = await self.resource_repo.count()
        return items, total

    async def update_resource(
        self,
        resource_id: int,
        payload: ResourceUpdate,
        current_user: UserModel
    ) -> ResourceModel:
        resource = await self.get_resource(resource_id)
        if resource.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You cannot modify another user's resource.")

        update_data = payload.model_dump(exclude_unset=True)
        if "version" not in update_data:
            update_data["version"] = resource.version + 1

        return await self.resource_repo.update(resource_id, **update_data)

    async def delete_resource(self, resource_id: int, current_user: UserModel) -> bool:
        resource = await self.get_resource(resource_id)
        if resource.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You cannot delete another user's resource.")
        return await self.resource_repo.delete(resource_id)
