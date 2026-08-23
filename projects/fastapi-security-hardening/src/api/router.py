from fastapi import APIRouter
from src.api.v1.vulnerable import router as vulnerable_router
from src.api.v1.hardened import router as hardened_router

api_v1_router = APIRouter()
api_v1_router.include_router(vulnerable_router)
api_v1_router.include_router(hardened_router)
