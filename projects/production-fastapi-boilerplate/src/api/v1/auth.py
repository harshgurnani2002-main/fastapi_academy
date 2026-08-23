from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_auth_service, get_current_user
from src.models.user import UserModel
from src.services.auth_service import AuthService
from src.schemas.common import APIResponse
from src.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from src.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=APIResponse[TokenResponse], summary="User Login")
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    tokens = await auth_service.authenticate(payload)
    return APIResponse(message="Login successful", data=tokens)


@router.post("/refresh", response_model=APIResponse[TokenResponse], summary="Refresh Token")
async def refresh(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    tokens = await auth_service.refresh(payload.refresh_token)
    return APIResponse(message="Token refreshed successfully", data=tokens)


@router.get("/me", response_model=APIResponse[UserOut], summary="Get Current Profile")
async def me(current_user: UserModel = Depends(get_current_user)):
    return APIResponse(data=UserOut.model_validate(current_user))
