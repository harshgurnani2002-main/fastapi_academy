from fastapi import APIRouter, Depends, status
from src.core.task_broker import AsyncWorkerBroker, get_broker
from src.schemas.common import APIResponse
from src.schemas.task import DocumentProcessRequest, TaskStatusResponse

router = APIRouter(prefix="/documents", tags=["Document Processing Queue"])


@router.post("/process", response_model=APIResponse[TaskStatusResponse], status_code=status.HTTP_202_ACCEPTED, summary="Enqueue Document Task")
async def process_document(
    payload: DocumentProcessRequest,
    broker: AsyncWorkerBroker = Depends(get_broker)
):
    task = await broker.dispatch_task(
        document_name=payload.document_name,
        file_size_bytes=payload.file_size_bytes,
        operation=payload.operation,
        idempotency_key=payload.idempotency_key,
        should_fail_transient=payload.simulate_transient_failure,
        should_poison_pill=payload.simulate_poison_pill
    )
    return APIResponse(
        message="Document processing task enqueued",
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
