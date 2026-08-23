from typing import List, Optional
from src.core.exceptions import ConflictException, NotFoundException, ConcurrencyConflictException
from src.models.project import ProjectModel
from src.repositories.organization_repo import OrganizationRepository
from src.repositories.project_repo import ProjectRepository
from src.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, project_repo: ProjectRepository, org_repo: OrganizationRepository):
        self.project_repo = project_repo
        self.org_repo = org_repo

    async def create_project(self, payload: ProjectCreate) -> ProjectModel:
        # 1. Validate Organization exists
        org = await self.org_repo.get_by_id(payload.org_id)
        if not org:
            raise NotFoundException("Organization", payload.org_id)

        # 2. Check Composite Unique constraint (org_id, code)
        existing = await self.project_repo.get_by_code(payload.org_id, payload.code)
        if existing:
            raise ConflictException(f"Project code '{payload.code}' is already in use within organization {payload.org_id}.")

        return await self.project_repo.create(
            org_id=payload.org_id,
            name=payload.name,
            code=payload.code,
            status=payload.status,
            priority=payload.priority,
            version_id=1
        )

    async def get_project(self, project_id: int, eager_tasks: bool = False) -> ProjectModel:
        if eager_tasks:
            proj = await self.project_repo.get_with_tasks_eager(project_id)
        else:
            proj = await self.project_repo.get_by_id(project_id)
            
        if not proj:
            raise NotFoundException("Project", project_id)
        return proj

    async def update_project_with_occ(self, project_id: int, payload: ProjectUpdate) -> ProjectModel:
        """
        Updates project state using Optimistic Concurrency Control (OCC).
        Guarantees no lost updates by verifying version_id before writing.
        """
        proj = await self.get_project(project_id)
        
        if proj.version_id != payload.version_id:
            raise ConcurrencyConflictException("Project", project_id, payload.version_id)

        update_data = payload.model_dump(exclude={"version_id"}, exclude_unset=True)
        update_data["version_id"] = proj.version_id + 1

        updated = await self.project_repo.update(project_id, **update_data)
        return updated
