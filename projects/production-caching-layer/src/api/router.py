from fastapi import APIRouter
from src.api.v1.products import router as products_router
from src.api.v1.metrics import router as metrics_router
from src.api.v1.cache_demo import router as demo_router

api_v1_router = APIRouter()
api_v1_router.include_router(products_router)
api_v1_router.include_router(metrics_router)
api_v1_router.include_router(demo_router)
