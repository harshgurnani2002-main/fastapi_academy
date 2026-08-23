from typing import Optional
from fastapi import APIRouter, Depends, status, Header
from src.core.dependencies import get_booking_service
from src.services.booking_service import BookingService
from src.schemas.common import APIResponse
from src.schemas.booking import BookingCreateRequest, BookingOut
from src.schemas.ticket import TicketHoldRequest, TicketOut

router = APIRouter(prefix="/bookings", tags=["Concurrent Bookings & Holds"])


@router.post("", response_model=APIResponse[BookingOut], status_code=status.HTTP_201_CREATED, summary="Atomic Ticket Booking with Idempotency")
async def book_ticket(
    payload: BookingCreateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key", description="Unique client token preventing duplicate processing"),
    booking_service: BookingService = Depends(get_booking_service)
):
    """
    Guarantees ACID concurrency and zero overselling via row-level locking (SELECT FOR UPDATE).
    """
    booking = await booking_service.book_ticket_pessimistic(payload, idempotency_key=idempotency_key)
    return APIResponse(message="Ticket booked successfully", data=BookingOut.model_validate(booking))


@router.post("/hold", response_model=APIResponse[TicketOut], summary="Hold Seat with TTL")
async def hold_seat(
    payload: TicketHoldRequest,
    event_id: int,
    booking_service: BookingService = Depends(get_booking_service)
):
    ticket = await booking_service.hold_ticket(
        event_id=event_id,
        seat_number=payload.seat_number,
        user_email=payload.user_email,
        hold_seconds=payload.hold_duration_seconds
    )
    return APIResponse(message="Seat held temporarily", data=TicketOut.model_validate(ticket))
