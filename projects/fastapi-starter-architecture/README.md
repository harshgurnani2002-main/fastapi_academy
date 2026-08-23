# Production-Ready FastAPI Starter Architecture

A clean, modular, production-tested architectural foundation for FastAPI backends implementing:
- **Clean Architecture & Hexagonal Ports/Adapters**
- **Decoupled Repositories & Service Layer**
- **Async SQLAlchemy 2.0 with aiosqlite / asyncpg**
- **Pydantic v2 Settings & Request/Response DTO Validation**
- **Correlation ID Tracking & Response Timing Middleware**
- **Standardized RFC Problem Details / API Error Envelopes**
- **Full Async Pytest Test Suite**

## Project Structure
```
src/
├── api/             # HTTP Presentation layer & endpoints
│   ├── v1/
│   │   ├── health.py
│   │   ├── users.py
│   │   └── items.py
│   └── router.py
├── core/            # Infrastructure configuration & cross-cutting concerns
│   ├── config.py
│   ├── dependencies.py
│   ├── exceptions.py
│   ├── logging.py
│   └── middleware.py
├── db/              # Database sessions and ORM mapping
│   ├── base.py
│   ├── models.py
│   └── session.py
├── domain/          # Pure business entities & domain exceptions
│   ├── models.py
│   └── exceptions.py
├── repositories/    # Data persistence implementations
│   ├── base.py
│   ├── item_repo.py
│   └── user_repo.py
├── schemas/         # Pydantic schemas & DTOs
│   ├── common.py
│   ├── health.py
│   ├── item.py
│   └── user.py
├── services/        # Application business logic workflows
│   ├── base.py
│   ├── item_service.py
│   └── user_service.py
└── main.py          # FastAPI application factory & lifespan
```

## Quick Start
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run test suite
pytest

# 3. Start server
uvicorn src.main:app --reload --port 8000
```
