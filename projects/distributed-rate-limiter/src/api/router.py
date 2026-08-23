from fastapi import APIRouter
from src.api.v1.limited_endpoints import router as limited_router
from src.api.v1.simulator import router as simulator_router
from src.api.v1.tier_management import router as tiers_router

api_v1_router = APIRouter()
api_v1_router.include_router(limited_router)
api_v1_router.include_router(simulator_router)
api_v1_router.include_router(tiers_router)
