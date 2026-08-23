"""
Project Repository with Eager Loading (Fixing N+1 Queries)
==========================================================
Senior Design Note:
The N+1 problem occurs when fetching N parent rows and executing N additional queries
for child relations. We utilize `selectinload(ProjectModel.tasks)` which fetches all
related tasks in a single vectorized `WHERE project_id IN (...)` statement.
"""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.project import ProjectModel
from src.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[ProjectModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProjectModel, session)

    async def get_by_code(self, org_id: int, code: str) -> Optional[ProjectModel]:
        stmt = select(ProjectModel).where(
            ProjectModel.org_id == org_id,
            ProjectModel.code == code
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_tasks_eager(self, project_id: int) -> Optional[ProjectModel]:
        """Eagerly load project along with all associated tasks (N+1 query killer)."""
        stmt = select(ProjectModel).where(
            ProjectModel.id == project_id
        ).options(selectinload(ProjectModel.tasks))
        
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_org(self, org_id: int, eager_tasks: bool = False) -> List[ProjectModel]:
        stmt = select(ProjectModel).where(ProjectModel.org_id == org_id)
        if eager_tasks:
            stmt = stmt.options(selectinload(ProjectModel.tasks))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
