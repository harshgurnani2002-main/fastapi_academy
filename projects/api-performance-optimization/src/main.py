from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.core.config import get_settings
from src.core.database import init_db
from src.api.v1.benchmarks import router as bench_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="API Performance Optimization & N+1 Query Elimination Showcase",
        lifespan=lifespan
    )
    app.include_router(bench_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_application()
