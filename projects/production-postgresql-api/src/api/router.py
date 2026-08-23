from fastapi import APIRouter
from src.api.v1.organizations import router as org_router
from src.api.v1.projects import router as proj_router
from src.api.v1.tasks import router as task_router
from src.api.v1.bulk import router as bulk_router
from src.api.v1.diagnostics import router as diag_router

api_v1_router = APIRouter()
api_v1_router.include_router(org_router)
api_v1_router.include_router(proj_router)
api_v1_router.include_router(task_router)
api_v1_router.include_router(bulk_router)
api_v1_router.include_router(diag_router)
