from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from src.core.config import get_settings
from src.core.middleware import RateLimitMiddleware
from src.core.exceptions import AppException, app_exception_handler
from src.api.router import api_v1_router

settings = get_settings()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Production Distributed Redis Rate Limiter with Sliding Window, Token Bucket & IETF HTTP Headers",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(RateLimitMiddleware, default_limit=settings.DEFAULT_RATE_LIMIT, default_window=settings.DEFAULT_WINDOW_SECONDS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)

    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_application()
