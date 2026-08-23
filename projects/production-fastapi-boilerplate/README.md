# Production FastAPI Boilerplate

An enterprise-grade FastAPI boilerplate with:
- **JWT Authentication & Stateless Refresh Token Rotation**
- **Role-Based Access Control (RBAC: Admin, Developer, User)**
- **API Versioning Architecture (`/api/v1` and `/api/v2`)**
- **Strict Security Headers (HSTS, NoSniff, X-Frame-Options)**
- **Async SQLAlchemy 2.0 Repositories & Services**
- **Automated Pytest Suite**

## Running Tests
```bash
pytest -v
```

## Running Server
```bash
uvicorn src.main:app --reload --port 8000
```
