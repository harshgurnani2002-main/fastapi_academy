from fastapi import FastAPI
from src.core.config import get_settings
from src.core.telemetry import ObservabilityMiddleware
from src.api.v1.health_and_metrics import router as obs_router

settings = get_settings()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Fully Observable Microservice with Prometheus RED Metrics & K8s Health Probes",
    )
    app.add_middleware(ObservabilityMiddleware)
    app.include_router(obs_router)
    return app


app = create_application()
