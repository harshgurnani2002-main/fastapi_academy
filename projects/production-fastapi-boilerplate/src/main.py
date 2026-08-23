from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from src.core.config import get_settings
from src.core.middleware import SecurityHeadersMiddleware, CorrelationIdMiddleware, ProcessTimeMiddleware
from src.core.exceptions import AppException, app_exception_handler, validation_exception_handler
from src.core.session import init_db, close_db
from src.api.router import v1_router, v2_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Production FastAPI Boilerplate with JWT, RBAC, Versioning, and Security Headers",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Middleware Chain
    app.add_middleware(ProcessTimeMiddleware)
    app.add_middleware(CorrelationIdMiddleware, header_name=settings.CORRELATION_ID_HEADER)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # Mount Versioned Routers
    app.include_router(v1_router, prefix=settings.API_V1_PREFIX)
    app.include_router(v2_router, prefix=settings.API_V2_PREFIX)

    return app


app = create_application()
