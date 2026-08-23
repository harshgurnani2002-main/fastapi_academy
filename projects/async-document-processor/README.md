# Async Document Processing Platform

Asynchronous Background Worker Pipeline with Celery/Arq architecture:
- **Task Lifecycle & Progress State Machine** (`QUEUED` -> `PROCESSING` -> `SUCCESS`/`RETRYING`/`DEAD_LETTER`)
- **Exponential Backoff with Jitter Retries**
- **Dead Letter Queue (DLQ) & Poison Pill Isolation**
- **Idempotent Job Dispatch Deduplication**
- **Manual Redrive / Replay from DLQ**

## Run Pytest
```bash
pytest -v
```
