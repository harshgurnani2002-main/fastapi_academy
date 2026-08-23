from fastapi import APIRouter
from src.api.v1.documents import router as documents_router
from src.api.v1.tasks import router as tasks_router
from src.api.v1.dlq import router as dlq_router

api_v1_router = APIRouter()
api_v1_router.include_router(documents_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(dlq_router)
