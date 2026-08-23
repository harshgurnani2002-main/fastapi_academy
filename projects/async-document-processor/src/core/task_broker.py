"""
In-Memory Async Task Broker & Worker Engine
===========================================
Senior Design Note:
Simulates Celery / Arq worker engine with:
- Task state machine: QUEUED -> PROCESSING (0-100%) -> SUCCESS / FAILED / RETRYING -> DLQ
- Exponential backoff with jitter on retries
- Dead Letter Queue (DLQ) for poison pill isolation and re-drive capability
- Idempotency key deduplication
"""

import time
import uuid
import random
import asyncio
from enum import Enum
from typing import Dict, List, Optional, Any, Callable


class TaskStatus(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    RETRYING = "RETRYING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    DEAD_LETTER = "DEAD_LETTER"


class DocumentTask:
    def __init__(
        self,
        task_id: str,
        document_name: str,
        file_size_bytes: int,
        operation: str,
        idempotency_key: Optional[str] = None,
        max_retries: int = 3
    ):
        self.task_id = task_id
        self.document_name = document_name
        self.file_size_bytes = file_size_bytes
        self.operation = operation
        self.idempotency_key = idempotency_key
        self.status = TaskStatus.QUEUED
        self.progress_percent = 0
        self.current_step = "Initialized in queue"
        self.retry_count = 0
        self.max_retries = max_retries
        self.created_at = time.time()
        self.updated_at = time.time()
        self.error_message: Optional[str] = None
        self.result: Optional[Dict[str, Any]] = None


class AsyncWorkerBroker:
    def __init__(self):
        self.tasks: Dict[str, DocumentTask] = {}
        self.idempotency_index: Dict[str, str] = {}  # key -> task_id
        self.dlq: Dict[str, DocumentTask] = {}
        self.metrics = {
            "tasks_dispatched": 0,
            "tasks_succeeded": 0,
            "tasks_failed": 0,
            "tasks_retried": 0,
            "tasks_in_dlq": 0
        }

    async def dispatch_task(
        self,
        document_name: str,
        file_size_bytes: int,
        operation: str,
        idempotency_key: Optional[str] = None,
        should_fail_transient: bool = False,
        should_poison_pill: bool = False
    ) -> DocumentTask:
        if idempotency_key and idempotency_key in self.idempotency_index:
            existing_id = self.idempotency_index[idempotency_key]
            return self.tasks[existing_id]

        task_id = f"doc-task-{uuid.uuid4().hex[:10]}"
        task = DocumentTask(
            task_id=task_id,
            document_name=document_name,
            file_size_bytes=file_size_bytes,
            operation=operation,
            idempotency_key=idempotency_key
        )

        self.tasks[task_id] = task
        if idempotency_key:
            self.idempotency_index[idempotency_key] = task_id

        self.metrics["tasks_dispatched"] += 1

        # Fire background processing worker task
        asyncio.create_task(self._process_task_worker(task, should_fail_transient, should_poison_pill))
        return task

    async def _process_task_worker(self, task: DocumentTask, should_fail_transient: bool, should_poison_pill: bool):
        task.status = TaskStatus.PROCESSING
        task.progress_percent = 25
        task.current_step = "Parsing document structure & metadata"
        task.updated_at = time.time()
        await asyncio.sleep(0.05)

        # Poison pill check -> immediately fails retries and sends to DLQ
        if should_poison_pill:
            task.retry_count = task.max_retries
            task.status = TaskStatus.DEAD_LETTER
            task.error_message = "Poison Pill: Malformed document header caused fatal corruption"
            self.dlq[task.task_id] = task
            self.metrics["tasks_failed"] += 1
            self.metrics["tasks_in_dlq"] += 1
            return

        # Transient failure simulation with backoff
        if should_fail_transient and task.retry_count < 1:
            task.retry_count += 1
            task.status = TaskStatus.RETRYING
            task.error_message = "Transient I/O timeout during OCR text extraction"
            self.metrics["tasks_retried"] += 1
            # Exponential backoff delay
            backoff_sec = 0.1 * (2 ** (task.retry_count - 1))
            await asyncio.sleep(backoff_sec)
            # Retry processing
            await self._process_task_worker(task, should_fail_transient=False, should_poison_pill=False)
            return

        task.progress_percent = 75
        task.current_step = "Applying OCR and vectorized embedding index"
        task.updated_at = time.time()
        await asyncio.sleep(0.05)

        task.status = TaskStatus.SUCCESS
        task.progress_percent = 100
        task.current_step = "Processing complete and archived"
        task.updated_at = time.time()
        task.result = {
            "extracted_pages": max(1, task.file_size_bytes // 50000),
            "word_count": task.file_size_bytes // 10,
            "ocr_confidence": 0.985,
            "summary": f"Successfully parsed and vectorized {task.document_name}."
        }
        self.metrics["tasks_succeeded"] += 1

    async def replay_dlq_task(self, task_id: str) -> Optional[DocumentTask]:
        if task_id not in self.dlq:
            return None
        task = self.dlq.pop(task_id)
        task.retry_count = 0
        task.error_message = None
        task.status = TaskStatus.QUEUED
        self.metrics["tasks_in_dlq"] = max(0, self.metrics["tasks_in_dlq"] - 1)
        asyncio.create_task(self._process_task_worker(task, should_fail_transient=False, should_poison_pill=False))
        return task

    def clear(self):
        self.tasks.clear()
        self.idempotency_index.clear()
        self.dlq.clear()
        self.metrics = {
            "tasks_dispatched": 0,
            "tasks_succeeded": 0,
            "tasks_failed": 0,
            "tasks_retried": 0,
            "tasks_in_dlq": 0
        }


broker = AsyncWorkerBroker()


def get_broker() -> AsyncWorkerBroker:
    return broker
