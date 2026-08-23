from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.exceptions import NotFoundException
from src.models.event import EventModel
from src.models.ticket import TicketModel, TicketStatus
from src.repositories.event_repo import EventRepository
from src.repositories.ticket_repo import TicketRepository
from src.schemas.event import EventCreate


class EventService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_repo = EventRepository(session)
        self.ticket_repo = TicketRepository(session)

    async def create_event(self, payload: EventCreate) -> EventModel:
        # 1. Create Event
        event = await self.event_repo.create(
            title=payload.title,
            venue=payload.venue,
            total_capacity=payload.total_capacity,
            available_tickets=payload.total_capacity,
            ticket_price=payload.ticket_price
        )

        # 2. Pre-generate individual seats
        for i in range(1, payload.total_capacity + 1):
            seat_num = f"S-{i:03d}"
            await self.ticket_repo.create(
                event_id=event.id,
                seat_number=seat_num,
                status=TicketStatus.AVAILABLE,
                price=payload.ticket_price
            )

        return event

    async def get_event(self, event_id: int) -> EventModel:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("Event", event_id)
        return event

    async def list_events(self) -> List[EventModel]:
        return await self.event_repo.list()

    async def list_tickets(self, event_id: int) -> List[TicketModel]:
        await self.get_event(event_id)
        return await self.ticket_repo.list_by_event(event_id)
