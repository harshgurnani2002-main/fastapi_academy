from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class DocumentProcessRequest(BaseModel):
    document_name: str = Field(..., min_length=1, max_length=200)
    file_size_bytes: int = Field(..., ge=1, le=100000000)
    operation: str = Field(default="OCR_AND_SUMMARIZE", description="OCR_AND_SUMMARIZE, PDF_EXTRACT, VECTORIZE")
    idempotency_key: Optional[str] = Field(None, max_length=100)
    simulate_transient_failure: bool = False
    simulate_poison_pill: bool = False


class TaskStatusResponse(BaseModel):
    task_id: str
    document_name: str
    status: str
    progress_percent: int
    current_step: str
    retry_count: int
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None


class WorkerMetricsResponse(BaseModel):
    tasks_dispatched: int
    tasks_succeeded: int
    tasks_failed: int
    tasks_retried: int
    tasks_in_dlq: int
