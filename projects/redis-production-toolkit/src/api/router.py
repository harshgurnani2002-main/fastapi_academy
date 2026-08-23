from fastapi import APIRouter
from src.api.v1.cache import router as cache_router
from src.api.v1.locks import router as locks_router
from src.api.v1.rate_limits import router as rate_limits_router
from src.api.v1.pubsub import router as pubsub_router
from src.api.v1.streams import router as streams_router
from src.api.v1.diagnostics import router as diagnostics_router

api_v1_router = APIRouter()
api_v1_router.include_router(cache_router)
api_v1_router.include_router(locks_router)
api_v1_router.include_router(rate_limits_router)
api_v1_router.include_router(pubsub_router)
api_v1_router.include_router(streams_router)
api_v1_router.include_router(diagnostics_router)
