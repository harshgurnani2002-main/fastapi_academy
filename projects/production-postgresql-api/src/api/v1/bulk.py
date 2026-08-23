from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_task_service
from src.services.task_service import TaskService
from src.schemas.common import APIResponse
from src.schemas.task import TaskBatchCreate

router = APIRouter(prefix="/bulk", tags=["High-Throughput Bulk Operations"])


@router.post("/tasks", response_model=APIResponse[dict], status_code=status.HTTP_201_CREATED, summary="Bulk Insert Tasks")
async def bulk_insert_tasks(
    payload: TaskBatchCreate,
    task_service: TaskService = Depends(get_task_service)
):
    inserted_count = await task_service.create_bulk_tasks(payload)
    return APIResponse(
        message=f"Successfully bulk inserted {inserted_count} tasks in a single database round-trip",
        data={"inserted_count": inserted_count}
    )
