from fastapi import APIRouter
from src.api.v1.events import router as events_router
from src.api.v1.bookings import router as bookings_router
from src.api.v1.concurrency_demo import router as demo_router

api_v1_router = APIRouter()
api_v1_router.include_router(events_router)
api_v1_router.include_router(bookings_router)
api_v1_router.include_router(demo_router)
