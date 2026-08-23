import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from src.core.dependencies import get_resource_service
from src.models.resource import ResourceStatus
from src.services.resource_service import ResourceService
from src.schemas.common import APIResponse, PaginatedResponse
from src.schemas.resource import ResourceOutV2

router = APIRouter(prefix="/resources", tags=["Resources v2 (Enhanced)"])


@router.get("", response_model=APIResponse[PaginatedResponse[ResourceOutV2]], summary="List Resources v2 with Enhanced Metadata")
async def list_resources_v2(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[ResourceStatus] = None,
    resource_service: ResourceService = Depends(get_resource_service)
):
    """API v2 endpoint demonstrating backward-compatible schema enhancements."""
    items, total = await resource_service.list_resources(page=page, size=size, status=status)
    return APIResponse(
        data=PaginatedResponse(
            items=[ResourceOutV2(
                **ResourceOutV2.model_validate(i).model_dump(exclude={"is_deprecated", "audit_tag"}),
                is_deprecated=False,
                audit_tag=f"v2-audit-res-{i.id}"
            ) for i in items],
            total=total,
            page=page,
            size=size,
            total_pages=math.ceil(total / size) if size > 0 else 1
        )
    )
