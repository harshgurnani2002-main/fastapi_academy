from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.core.security import decode_jwt
from src.core.exceptions import UnauthorizedException
from src.models.user import UserModel
from src.repositories.user_repo import UserRepository


async def get_current_user(
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_db_session)
) -> UserModel:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing Bearer authorization header.")

    token = authorization.split("Bearer ")[1].strip()
    payload = decode_jwt(token)
    if not payload:
        raise UnauthorizedException("Invalid or expired token.")

    user_repo = UserRepository(session)
    user_id = int(payload.get("sub", 0))
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found.")

    return user
