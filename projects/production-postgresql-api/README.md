# Production-Grade PostgreSQL API

High-performance asynchronous PostgreSQL backend engineering showcase with:
- **Async SQLAlchemy 2.0 with connection pool tuning & diagnostics**
- **Composite Indexes & Keyset / Cursor Pagination (O(log N) efficiency)**
- **Vectorized Eager Loading with `selectinload` to eliminate N+1 queries**
- **Optimistic Concurrency Control (OCC) to prevent lost updates**
- **Unit of Work (UoW) Pattern with nested savepoints**
- **Vectorized Bulk Operations for 10x throughput**

## Run Pytest Suite
```bash
pytest -v
```
