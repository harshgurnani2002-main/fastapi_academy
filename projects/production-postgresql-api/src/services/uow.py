"""
Unit of Work (UoW) Pattern with Savepoints
==========================================
Senior Design Note:
The Unit of Work pattern coordinates transactional boundaries across multiple repositories.
Provides atomic guarantees: either all operations succeed or all roll back together.
Supports nested savepoints for partial rollback scenarios.
"""

from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from src.repositories.organization_repo import OrganizationRepository
from src.repositories.project_repo import ProjectRepository
from src.repositories.task_repo import TaskRepository


class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.organizations = OrganizationRepository(session)
        self.projects = ProjectRepository(session)
        self.tasks = TaskRepository(session)

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()

    @asynccontextmanager
    async def savepoint(self):
        """Create a nested transaction savepoint."""
        async with self.session.begin_nested():
            yield
