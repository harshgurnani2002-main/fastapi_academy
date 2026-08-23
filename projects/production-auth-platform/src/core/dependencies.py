from typing import Callable, List, Optional
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.core.redis import AsyncRedisStore, get_redis_client
from src.core.security import decode_jwt
from src.core.exceptions import UnauthorizedException, ForbiddenException
from src.models.user import UserModel, UserRole
from src.repositories.user_repo import UserRepository
from src.services.auth_service import AuthService
from src.services.api_key_service import ApiKeyService


def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
    redis: AsyncRedisStore = Depends(get_redis_client)
) -> AuthService:
    return AuthService(session, redis)


def get_api_key_service(session: AsyncSession = Depends(get_db_session)) -> ApiKeyService:
    return ApiKeyService(session)


async def get_current_user(
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_db_session),
    redis: AsyncRedisStore = Depends(get_redis_client)
) -> UserModel:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing Bearer authorization header.")

    token = authorization.split("Bearer ")[1].strip()
    payload = decode_jwt(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired access token.")

    # Check JTI Blacklist in Redis
    if "jti" in payload and await redis.get(f"blacklist:{payload['jti']}"):
        raise UnauthorizedException("Token has been revoked.")

    user_repo = UserRepository(session)
    user_id = int(payload.get("sub", 0))
    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedException("User account not found or disabled.")

    return user


def require_roles(*allowed_roles: UserRole) -> Callable:
    async def role_checker(current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(f"Operation requires one of roles: {[r.value for r in allowed_roles]}")
        return current_user
    return role_checker


def require_scopes(*required_scopes: str) -> Callable:
    async def scope_checker(current_user: UserModel = Depends(get_current_user)) -> UserModel:
        user_scopes = set(current_user.scopes or [])
        if "admin:all" in user_scopes:
            return current_user
        for s in required_scopes:
            if s not in user_scopes:
                raise ForbiddenException(f"Missing required scope: '{s}'")
        return current_user
    return scope_checker
