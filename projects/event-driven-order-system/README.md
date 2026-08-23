# Event-Driven Order Processing System

Production Event-Driven Architecture featuring:
- **Transactional Outbox Pattern** (Zero dual-write distributed transaction failures)
- **Outbox Relay Worker** (Asynchronous stream publishing)
- **Idempotent Consumers** (Deduplication ledger ensuring exactly-once processing)
- **Event Stream Replay & Audit Trail**

## Run Pytest
```bash
pytest -v
```
