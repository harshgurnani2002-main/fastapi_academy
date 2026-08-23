from fastapi import APIRouter, Depends, Header, status
from src.core.dependencies import get_auth_service, get_current_user
from src.models.user import UserModel
from src.services.auth_service import AuthService
from src.schemas.common import APIResponse
from src.schemas.auth import RegisterRequest, LoginRequest, TokenPairResponse, RefreshTokenRequest
from src.schemas.user import UserProfileOut

router = APIRouter(prefix="/auth", tags=["Authentication & Token Lifecycle"])


@router.post("/register", response_model=APIResponse[UserProfileOut], status_code=status.HTTP_201_CREATED, summary="Register User")
async def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    user = await auth_service.register(payload)
    return APIResponse(message="User registered", data=UserProfileOut.model_validate(user))


@router.post("/login", response_model=APIResponse[TokenPairResponse], summary="User Login")
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    tokens = await auth_service.login(payload)
    return APIResponse(message="Login successful", data=tokens)


@router.post("/refresh", response_model=APIResponse[TokenPairResponse], summary="Refresh Token Rotation")
async def refresh_tokens(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    tokens = await auth_service.rotate_refresh_token(payload.refresh_token)
    return APIResponse(message="Tokens refreshed with rotation", data=tokens)


@router.post("/logout", response_model=APIResponse[dict], summary="Logout Current Session")
async def logout(
    authorization: str = Header(None),
    current_user: UserModel = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    token = authorization.split("Bearer ")[1].strip()
    await auth_service.logout(session_id="current", access_token=token)
    return APIResponse(message="Logged out successfully", data={"logged_out": True})


@router.post("/logout-all", response_model=APIResponse[dict], summary="Global Logout All Devices")
async def logout_all(
    current_user: UserModel = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    await auth_service.logout_all(current_user.id)
    return APIResponse(message="All sessions revoked", data={"revoked_all": True})


@router.get("/me", response_model=APIResponse[UserProfileOut], summary="Get Current Profile")
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return APIResponse(data=UserProfileOut.model_validate(current_user))
