import math
from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_resource_service, get_current_user
from src.models.user import UserModel
from src.models.resource import ResourceStatus
from src.services.resource_service import ResourceService
from src.schemas.common import APIResponse, PaginatedResponse
from src.schemas.resource import ResourceCreate, ResourceUpdate, ResourceOut

router = APIRouter(prefix="/resources", tags=["Resources v1"])


@router.post("", response_model=APIResponse[ResourceOut], status_code=status.HTTP_201_CREATED, summary="Create Resource")
async def create_resource(
    payload: ResourceCreate,
    resource_service: ResourceService = Depends(get_resource_service),
    current_user: UserModel = Depends(get_current_user)
):
    res = await resource_service.create_resource(payload, current_user)
    return APIResponse(message="Resource created", data=ResourceOut.model_validate(res))


@router.get("", response_model=APIResponse[PaginatedResponse[ResourceOut]], summary="List Resources v1")
async def list_resources(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[ResourceStatus] = None,
    resource_service: ResourceService = Depends(get_resource_service)
):
    items, total = await resource_service.list_resources(page=page, size=size, status=status)
    return APIResponse(
        data=PaginatedResponse(
            items=[ResourceOut.model_validate(i) for i in items],
            total=total,
            page=page,
            size=size,
            total_pages=math.ceil(total / size) if size > 0 else 1
        )
    )


@router.get("/{resource_id}", response_model=APIResponse[ResourceOut], summary="Get Resource by ID")
async def get_resource(
    resource_id: int,
    resource_service: ResourceService = Depends(get_resource_service)
):
    res = await resource_service.get_resource(resource_id)
    return APIResponse(data=ResourceOut.model_validate(res))


@router.put("/{resource_id}", response_model=APIResponse[ResourceOut], summary="Update Resource")
async def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    resource_service: ResourceService = Depends(get_resource_service),
    current_user: UserModel = Depends(get_current_user)
):
    updated = await resource_service.update_resource(resource_id, payload, current_user)
    return APIResponse(message="Resource updated", data=ResourceOut.model_validate(updated))


@router.delete("/{resource_id}", response_model=APIResponse[dict], summary="Delete Resource")
async def delete_resource(
    resource_id: int,
    resource_service: ResourceService = Depends(get_resource_service),
    current_user: UserModel = Depends(get_current_user)
):
    await resource_service.delete_resource(resource_id, current_user)
    return APIResponse(message="Resource deleted successfully", data={"deleted": True, "id": resource_id})
