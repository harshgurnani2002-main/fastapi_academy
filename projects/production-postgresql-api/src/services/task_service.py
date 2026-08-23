from typing import List, Optional, Tuple
from src.core.exceptions import NotFoundException
from src.models.task import TaskModel, TaskStatus
from src.repositories.project_repo import ProjectRepository
from src.repositories.task_repo import TaskRepository
from src.schemas.task import TaskCreate, TaskBatchCreate


class TaskService:
    def __init__(self, task_repo: TaskRepository, project_repo: ProjectRepository):
        self.task_repo = task_repo
        self.project_repo = project_repo

    async def create_task(self, payload: TaskCreate) -> TaskModel:
        project = await self.project_repo.get_by_id(payload.project_id)
        if not project:
            raise NotFoundException("Project", payload.project_id)

        return await self.task_repo.create(
            project_id=payload.project_id,
            title=payload.title,
            description=payload.description,
            status=payload.status,
            priority=payload.priority,
            due_date=payload.due_date,
            tags=payload.tags,
            assignee_email=payload.assignee_email
        )

    async def create_bulk_tasks(self, batch: TaskBatchCreate) -> int:
        task_dicts = [t.model_dump() for t in batch.items]
        return await self.task_repo.bulk_insert_tasks(task_dicts)

    async def paginate_tasks(
        self,
        project_id: int,
        cursor: Optional[str],
        limit: int = 20,
        status: Optional[TaskStatus] = None
    ) -> Tuple[List[TaskModel], Optional[str], bool]:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project", project_id)
            
        return await self.task_repo.paginate_cursor(
            project_id=project_id,
            cursor=cursor,
            limit=limit,
            status=status
        )
