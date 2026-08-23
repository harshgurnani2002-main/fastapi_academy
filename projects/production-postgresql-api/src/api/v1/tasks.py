from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_task_service
from src.models.task import TaskStatus
from src.services.task_service import TaskService
from src.schemas.common import APIResponse, CursorPaginatedResponse
from src.schemas.task import TaskCreate, TaskOut

router = APIRouter(prefix="/tasks", tags=["Tasks & Keyset Pagination"])


@router.post("", response_model=APIResponse[TaskOut], status_code=status.HTTP_201_CREATED, summary="Create Task")
async def create_task(
    payload: TaskCreate,
    task_service: TaskService = Depends(get_task_service)
):
    task = await task_service.create_task(payload)
    return APIResponse(message="Task created", data=TaskOut.model_validate(task))


@router.get("", response_model=APIResponse[CursorPaginatedResponse[TaskOut]], summary="Keyset Cursor-Based Pagination")
async def list_tasks_cursor(
    project_id: int = Query(..., description="Parent Project ID"),
    cursor: Optional[str] = Query(None, description="Opaque base64 cursor token for next page"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[TaskStatus] = None,
    task_service: TaskService = Depends(get_task_service)
):
    """
    Keyset pagination endpoint delivering constant O(log N) lookup time
    irrespective of total table size.
    """
    items, next_cursor, has_more = await task_service.paginate_tasks(
        project_id=project_id,
        cursor=cursor,
        limit=limit,
        status=status
    )

    return APIResponse(
        data=CursorPaginatedResponse(
            items=[TaskOut.model_validate(t) for t in items],
            next_cursor=next_cursor,
            has_more=has_more,
            limit=limit
        )
    )
