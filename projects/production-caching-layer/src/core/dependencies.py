from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.services.caching_service import CachingService


def get_caching_service(session: AsyncSession = Depends(get_db_session)) -> CachingService:
    return CachingService(session)
