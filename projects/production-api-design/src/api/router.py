from fastapi import APIRouter
from src.api.v1.customers import router as v1_router
from src.api.v2.customers import router as v2_router

api_router = APIRouter()
api_router.include_router(v1_router)
api_router.include_router(v2_router)
