from typing import List
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_organization_service
from src.services.organization_service import OrganizationService
from src.schemas.common import APIResponse
from src.schemas.organization import OrganizationCreate, OrganizationOut

router = APIRouter(prefix="/organizations", tags=["Tenant Organizations"])


@router.post("", response_model=APIResponse[OrganizationOut], status_code=status.HTTP_201_CREATED, summary="Create Organization")
async def create_organization(
    payload: OrganizationCreate,
    org_service: OrganizationService = Depends(get_organization_service)
):
    org = await org_service.create_organization(payload)
    return APIResponse(message="Organization created", data=OrganizationOut.model_validate(org))


@router.get("", response_model=APIResponse[List[OrganizationOut]], summary="List Organizations")
async def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    org_service: OrganizationService = Depends(get_organization_service)
):
    items = await org_service.list_organizations(skip=skip, limit=limit)
    return APIResponse(data=[OrganizationOut.model_validate(i) for i in items])


@router.get("/{slug}", response_model=APIResponse[OrganizationOut], summary="Get Organization by Slug")
async def get_organization(
    slug: str,
    org_service: OrganizationService = Depends(get_organization_service)
):
    org = await org_service.get_by_slug(slug)
    return APIResponse(data=OrganizationOut.model_validate(org))
