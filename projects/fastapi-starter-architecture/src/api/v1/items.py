import math
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_item_service
from src.services.item_service import ItemService
from src.schemas.common import APIResponse, PaginatedResponse
from src.schemas.item import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/items", tags=["Items"])


@router.post("", response_model=APIResponse[ItemResponse], status_code=status.HTTP_201_CREATED, summary="Create Item")
async def create_item(
    payload: ItemCreate,
    item_service: ItemService = Depends(get_item_service)
):
    """Create a new item associated with an existing owner."""
    item = await item_service.create_item(payload)
    return APIResponse(message="Item created successfully", data=ItemResponse.model_validate(item))


@router.get("", response_model=APIResponse[PaginatedResponse[ItemResponse]], summary="List Items")
async def list_items(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    published_only: bool = Query(False, description="Filter only published items"),
    item_service: ItemService = Depends(get_item_service)
):
    """List items with optional published filter and pagination."""
    items, total = await item_service.list_items(page=page, size=size, published_only=published_only)
    total_pages = math.ceil(total / size) if size > 0 else 1
    
    return APIResponse(
        data=PaginatedResponse(
            items=[ItemResponse.model_validate(i) for i in items],
            total=total,
            page=page,
            size=size,
            total_pages=total_pages
        )
    )


@router.get("/{item_id}", response_model=APIResponse[ItemResponse], summary="Get Item by ID")
async def get_item(
    item_id: int,
    item_service: ItemService = Depends(get_item_service)
):
    """Retrieve single item by its unique ID."""
    item = await item_service.get_item_by_id(item_id)
    return APIResponse(data=ItemResponse.model_validate(item))


@router.put("/{item_id}", response_model=APIResponse[ItemResponse], summary="Update Item")
async def update_item(
    item_id: int,
    payload: ItemUpdate,
    item_service: ItemService = Depends(get_item_service)
):
    """Update attributes of an existing item."""
    item = await item_service.update_item(item_id, payload)
    return APIResponse(message="Item updated successfully", data=ItemResponse.model_validate(item))


@router.delete("/{item_id}", response_model=APIResponse[dict], summary="Delete Item")
async def delete_item(
    item_id: int,
    item_service: ItemService = Depends(get_item_service)
):
    """Delete an item by ID."""
    await item_service.delete_item(item_id)
    return APIResponse(message=f"Item {item_id} deleted successfully", data={"deleted": True, "id": item_id})
