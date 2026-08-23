from fastapi import FastAPI
from src.core.config import get_settings
from src.api.v1.ledger import router as ledger_router

settings = get_settings()


def create_application() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)
    app.include_router(ledger_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_application()
