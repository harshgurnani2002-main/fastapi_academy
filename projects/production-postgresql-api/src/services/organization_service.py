from typing import List, Tuple
from src.core.exceptions import ConflictException, NotFoundException
from src.models.organization import OrganizationModel
from src.repositories.organization_repo import OrganizationRepository
from src.schemas.organization import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    def __init__(self, org_repo: OrganizationRepository):
        self.org_repo = org_repo

    async def create_organization(self, payload: OrganizationCreate) -> OrganizationModel:
        existing = await self.org_repo.get_by_slug(payload.slug)
        if existing:
            raise ConflictException(f"Organization with slug '{payload.slug}' already exists.")
        
        return await self.org_repo.create(
            name=payload.name,
            slug=payload.slug,
            tier=payload.tier,
            settings_json=payload.settings_json
        )

    async def get_by_id(self, org_id: int) -> OrganizationModel:
        org = await self.org_repo.get_by_id(org_id)
        if not org:
            raise NotFoundException("Organization", org_id)
        return org

    async def get_by_slug(self, slug: str) -> OrganizationModel:
        org = await self.org_repo.get_by_slug(slug)
        if not org:
            raise NotFoundException("Organization", slug)
        return org

    async def list_organizations(self, skip: int = 0, limit: int = 50) -> List[OrganizationModel]:
        return await self.org_repo.list(skip=skip, limit=limit)
