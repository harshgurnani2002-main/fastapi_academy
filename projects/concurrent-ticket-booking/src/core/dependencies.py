from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.services.booking_service import BookingService
from src.services.event_service import EventService


def get_event_service(session: AsyncSession = Depends(get_db_session)) -> EventService:
    return EventService(session)


def get_booking_service(session: AsyncSession = Depends(get_db_session)) -> BookingService:
    return BookingService(session)
