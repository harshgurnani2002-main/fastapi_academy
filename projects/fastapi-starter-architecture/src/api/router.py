from fastapi import APIRouter
from src.api.v1.health import router as health_router
from src.api.v1.users import router as users_router
from src.api.v1.items import router as items_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(users_router)
api_router.include_router(items_router)
