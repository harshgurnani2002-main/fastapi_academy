from typing import List
from fastapi import APIRouter, Depends
from src.core.task_broker import AsyncWorkerBroker, get_broker
from src.core.exceptions import NotFoundException
from src.schemas.common import APIResponse
from src.schemas.task import TaskStatusResponse, WorkerMetricsResponse

router = APIRouter(prefix="/dlq", tags=["Dead Letter Queue (DLQ) & Worker Metrics"])


@router.get("/messages", response_model=APIResponse[List[TaskStatusResponse]], summary="List Dead Letter Queue Items")
async def list_dlq(broker: AsyncWorkerBroker = Depends(get_broker)):
    items = [
        TaskStatusResponse(
            task_id=t.task_id,
            document_name=t.document_name,
            status=t.status.value,
            progress_percent=t.progress_percent,
            current_step=t.current_step,
            retry_count=t.retry_count,
            error_message=t.error_message,
            result=t.result
        )
        for t in broker.dlq.values()
    ]
    return APIResponse(data=items)


@router.post("/{task_id}/replay", response_model=APIResponse[TaskStatusResponse], summary="Re-Drive / Replay Poison Task")
async def replay_task(task_id: str, broker: AsyncWorkerBroker = Depends(get_broker)):
    task = await broker.replay_dlq_task(task_id)
    if not task:
        raise NotFoundException("Dead Letter Task", task_id)

    return APIResponse(
        message="Task re-driven from DLQ back to active worker queue",
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


@router.get("/metrics", response_model=APIResponse[WorkerMetricsResponse], summary="Worker Fleet & Queue Metrics")
async def get_metrics(broker: AsyncWorkerBroker = Depends(get_broker)):
    return APIResponse(data=WorkerMetricsResponse(**broker.metrics))
