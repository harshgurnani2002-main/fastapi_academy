from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from src.core.config import get_settings
from src.core.logging import setup_logging
from src.core.middleware import CorrelationIdMiddleware, ProcessTimeMiddleware
from src.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from src.db.session import init_db, close_db
from src.api.router import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown event management."""
    # Startup
    setup_logging(settings.LOG_LEVEL)
    await init_db()
    yield
    # Shutdown
    await close_db()


def create_application() -> FastAPI:
    """Application factory for FastAPI app creation."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Production-Grade FastAPI Starter Architecture with Clean Architecture & DI",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Middlewares (Executed in reverse order of addition)
    app.add_middleware(ProcessTimeMiddleware)
    app.add_middleware(CorrelationIdMiddleware, header_name=settings.CORRELATION_ID_HEADER)
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
    app.add_exception_handler(Exception, generic_exception_handler)

    # Routers
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_application()
