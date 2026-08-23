"""
Booking Service with Pessimistic Locking & Idempotency Protection
=================================================================
Senior Design Note:
Atomic workflow:
1. Validate or replay from Idempotency cache.
2. Acquire exclusive row lock on Event and Ticket via `SELECT ... FOR UPDATE`.
3. Check state invariant (Ticket MUST be AVAILABLE or expired hold).
4. Update Ticket status to BOOKED and decrement Event capacity.
5. Record Booking in ledger.
6. Commit transaction atomically.
"""

import asyncio
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.exceptions import (
    NotFoundException, SoldOutException, SeatUnavailableException,
    IdempotencyConflictException, ExpiredHoldException
)
from src.models.ticket import TicketStatus
from src.models.booking import BookingModel, BookingStatus
from src.models.idempotency import IdempotencyState
from src.repositories.event_repo import EventRepository
from src.repositories.ticket_repo import TicketRepository
from src.repositories.booking_repo import BookingRepository
from src.repositories.idempotency_repo import IdempotencyRepository
from src.schemas.booking import BookingCreateRequest


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class BookingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.event_repo = EventRepository(session)
        self.ticket_repo = TicketRepository(session)
        self.booking_repo = BookingRepository(session)
        self.idempotency_repo = IdempotencyRepository(session)

    async def book_ticket_pessimistic(
        self,
        payload: BookingCreateRequest,
        idempotency_key: Optional[str] = None
    ) -> BookingModel:
        # 1. Idempotency Check
        if idempotency_key:
            existing_record = await self.idempotency_repo.get_record(idempotency_key)
            if existing_record:
                if existing_record.state == IdempotencyState.COMPLETED:
                    existing_booking = await self.booking_repo.get_by_idempotency_key(idempotency_key)
                    if existing_booking:
                        return existing_booking
                elif existing_record.state == IdempotencyState.PROCESSING:
                    raise IdempotencyConflictException(idempotency_key)

            req_hash = hashlib.sha256(f"{payload.event_id}:{payload.seat_number}:{payload.customer_email}".encode()).hexdigest()
            await self.idempotency_repo.create_in_progress(idempotency_key, req_hash, 86400)

        # 2. Lock Event Row (Row-Level Pessimistic Lock)
        event = await self.event_repo.get_for_update(payload.event_id)
        if not event:
            raise NotFoundException("Event", payload.event_id)

        if event.available_tickets <= 0:
            raise SoldOutException(payload.event_id)

        # 3. Lock Specific Ticket/Seat Row
        ticket = await self.ticket_repo.get_seat_for_update(payload.event_id, payload.seat_number)
        if not ticket:
            raise NotFoundException("Seat", payload.seat_number)

        now = datetime.now(timezone.utc)
        held_until_utc = to_utc(ticket.held_until)

        # Check availability (including expired holds)
        if ticket.status == TicketStatus.BOOKED:
            raise SeatUnavailableException(payload.seat_number, "booked")
        elif ticket.status == TicketStatus.HELD:
            if held_until_utc and held_until_utc > now and ticket.held_by_user != payload.customer_email:
                raise SeatUnavailableException(payload.seat_number, "held by another user")

        # 4. State Transitions
        ticket.status = TicketStatus.BOOKED
        ticket.held_until = None
        ticket.held_by_user = None
        
        event.available_tickets -= 1

        # 5. Create Booking
        booking = await self.booking_repo.create(
            event_id=event.id,
            ticket_id=ticket.id,
            customer_email=payload.customer_email,
            seat_number=ticket.seat_number,
            amount_paid=ticket.price,
            status=BookingStatus.CONFIRMED,
            idempotency_key=idempotency_key or f"auto_{now.timestamp()}_{ticket.id}"
        )

        # 6. Mark Idempotency complete
        if idempotency_key:
            await self.idempotency_repo.mark_completed(
                idempotency_key,
                201,
                {"booking_id": booking.id, "status": "confirmed"}
            )

        return booking

    async def hold_ticket(
        self,
        event_id: int,
        seat_number: str,
        user_email: str,
        hold_seconds: int = 600
    ):
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("Event", event_id)

        ticket = await self.ticket_repo.get_seat_for_update(event_id, seat_number)
        if not ticket:
            raise NotFoundException("Seat", seat_number)

        now = datetime.now(timezone.utc)
        held_until_utc = to_utc(ticket.held_until)

        if ticket.status == TicketStatus.BOOKED:
            raise SeatUnavailableException(seat_number, "booked")
        elif ticket.status == TicketStatus.HELD and held_until_utc and held_until_utc > now:
            raise SeatUnavailableException(seat_number, "held")

        ticket.status = TicketStatus.HELD
        ticket.held_until = now + timedelta(seconds=hold_seconds)
        ticket.held_by_user = user_email
        await self.session.flush()
        return ticket

    async def unsafe_book_ticket(self, event_id: int, seat_number: str, customer_email: str) -> dict:
        event = await self.event_repo.get_by_id(event_id)
        if not event or event.available_tickets <= 0:
            return {"success": False, "reason": "Sold Out"}

        # Simulate delay
        await asyncio.sleep(0.02)

        event.available_tickets -= 1
        await self.session.flush()

        return {"success": True, "seat": seat_number, "remaining": event.available_tickets}
