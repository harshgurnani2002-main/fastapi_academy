from fastapi import APIRouter, Depends
from src.core.task_broker import AsyncWorkerBroker, get_broker
from src.core.exceptions import NotFoundException
from src.schemas.common import APIResponse
from src.schemas.task import TaskStatusResponse

router = APIRouter(prefix="/tasks", tags=["Task Polling & State Machine"])


@router.get("/{task_id}/status", response_model=APIResponse[TaskStatusResponse], summary="Poll Task Status & Output")
async def get_task_status(
    task_id: str,
    broker: AsyncWorkerBroker = Depends(get_broker)
):
    task = broker.tasks.get(task_id)
    if not task:
        raise NotFoundException("Task", task_id)

    return APIResponse(
        data=TaskStatusResponse(
            task_id=task.task_id,
            document_name=task.document_name,
            status=task.status.value,
            progress_percent=task.progress_percent,
            current_step=task.current_step,
            retry_count=task.retry_count,
            error_message=task.error_message,
            result=task.result
        )
    )
