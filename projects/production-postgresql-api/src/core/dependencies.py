from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.repositories.organization_repo import OrganizationRepository
from src.repositories.project_repo import ProjectRepository
from src.repositories.task_repo import TaskRepository
from src.services.organization_service import OrganizationService
from src.services.project_service import ProjectService
from src.services.task_service import TaskService
from src.services.uow import UnitOfWork


def get_uow(session: AsyncSession = Depends(get_db_session)) -> UnitOfWork:
    return UnitOfWork(session)


def get_organization_service(session: AsyncSession = Depends(get_db_session)) -> OrganizationService:
    return OrganizationService(OrganizationRepository(session))


def get_project_service(session: AsyncSession = Depends(get_db_session)) -> ProjectService:
    return ProjectService(ProjectRepository(session), OrganizationRepository(session))


def get_task_service(session: AsyncSession = Depends(get_db_session)) -> TaskService:
    return TaskService(TaskRepository(session), ProjectRepository(session))
