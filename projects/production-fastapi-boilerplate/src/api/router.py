from fastapi import APIRouter
from src.api.v1.auth import router as auth_router
from src.api.v1.users import router as users_router
from src.api.v1.resources import router as resources_v1_router
from src.api.v2.resources import router as resources_v2_router

v1_router = APIRouter()
v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(resources_v1_router)

v2_router = APIRouter()
v2_router.include_router(resources_v2_router)
