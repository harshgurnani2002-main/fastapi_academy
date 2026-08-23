from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.services.order_service import OrderEventService


def get_order_service(session: AsyncSession = Depends(get_db_session)) -> OrderEventService:
    return OrderEventService(session)
