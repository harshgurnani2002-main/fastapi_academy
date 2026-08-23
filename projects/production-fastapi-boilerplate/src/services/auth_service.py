from src.core.exceptions import UnauthorizedException
from src.core.security import verify_password, create_jwt_token, decode_jwt_token
from src.core.config import get_settings
from src.repositories.user_repo import UserRepository
from src.schemas.auth import LoginRequest, TokenResponse

settings = get_settings()


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def authenticate(self, payload: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password.")
        
        if not user.is_active:
            raise UnauthorizedException("Account is inactive.")

        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role)
        }

        access_token = create_jwt_token(
            token_payload,
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        refresh_token = create_jwt_token(
            {**token_payload, "type": "refresh"},
            expires_in_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def refresh(self, refresh_token_str: str) -> TokenResponse:
        payload = decode_jwt_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid or expired refresh token.")

        user_id = int(payload.get("sub", 0))
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive.")

        token_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role)
        }

        new_access = create_jwt_token(token_payload, expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        new_refresh = create_jwt_token({**token_payload, "type": "refresh"}, expires_in_seconds=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
