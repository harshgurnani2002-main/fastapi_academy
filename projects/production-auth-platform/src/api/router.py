from fastapi import APIRouter
from src.api.v1.auth import router as auth_router
from src.api.v1.oauth import router as oauth_router
from src.api.v1.mfa import router as mfa_router
from src.api.v1.api_keys import router as api_keys_router
from src.api.v1.protected import router as protected_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(oauth_router)
api_v1_router.include_router(mfa_router)
api_v1_router.include_router(api_keys_router)
api_v1_router.include_router(protected_router)
