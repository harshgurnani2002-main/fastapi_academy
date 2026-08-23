from fastapi import APIRouter
from src.api.v1.orders import router as orders_router
from src.api.v1.outbox import router as outbox_router

api_v1_router = APIRouter()
api_v1_router.include_router(orders_router)
api_v1_router.include_router(outbox_router)
