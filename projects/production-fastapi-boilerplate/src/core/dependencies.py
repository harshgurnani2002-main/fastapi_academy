from typing import Callable, List
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.session import get_db
from src.core.security import decode_jwt_token
from src.core.exceptions import UnauthorizedException, ForbiddenException
from src.models.user import UserModel, UserRole
from src.repositories.user_repo import UserRepository
from src.repositories.resource_repo import ResourceRepository
from src.services.auth_service import AuthService
from src.services.user_service import UserService
from src.services.resource_service import ResourceService


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)


def get_resource_repository(session: AsyncSession = Depends(get_db)) -> ResourceRepository:
    return ResourceRepository(session)


def get_auth_service(user_repo: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(user_repo)


def get_user_service(user_repo: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(user_repo)


def get_resource_service(res_repo: ResourceRepository = Depends(get_resource_repository)) -> ResourceService:
    return ResourceService(res_repo)


async def get_current_user(
    authorization: str = Header(None),
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserModel:
    """Dependency ensuring caller provides a valid Bearer JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or invalid Authorization header.")
    
    token = authorization.split("Bearer ")[1].strip()
    payload = decode_jwt_token(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired token.")

    user_id = int(payload.get("sub", 0))
    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedException("User inactive or not found.")

    return user


def require_role(*allowed_roles: UserRole) -> Callable:
    """Dependency factory enforcing role-based authorization."""
    async def role_checker(current_user: UserModel = Depends(get_current_user)) -> UserModel:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(f"Requires one of roles: {[r.value for r in allowed_roles]}")
        return current_user
    return role_checker
