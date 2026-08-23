from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from src.core.config import get_settings
from src.core.database import init_db, close_db
from src.core.middleware import CorrelationIdMiddleware, ExecutionTimerMiddleware
from src.core.exceptions import AppException, app_exception_handler, validation_exception_handler
from src.api.router import api_v1_router

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
        description="Concurrent Ticket Booking System with Row-Level Locking (SELECT FOR UPDATE) & Idempotency",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(ExecutionTimerMiddleware)
    app.add_middleware(CorrelationIdMiddleware, header_name=settings.CORRELATION_ID_HEADER)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_application()
