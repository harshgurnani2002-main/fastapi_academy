from typing import List
from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_event_service
from src.services.event_service import EventService
from src.schemas.common import APIResponse
from src.schemas.event import EventCreate, EventOut
from src.schemas.ticket import TicketOut

router = APIRouter(prefix="/events", tags=["Events & Inventory"])


@router.post("", response_model=APIResponse[EventOut], status_code=status.HTTP_201_CREATED, summary="Create Event & Generate Seats")
async def create_event(
    payload: EventCreate,
    event_service: EventService = Depends(get_event_service)
):
    event = await event_service.create_event(payload)
    return APIResponse(message="Event and seats created", data=EventOut.model_validate(event))


@router.get("", response_model=APIResponse[List[EventOut]], summary="List Events")
async def list_events(event_service: EventService = Depends(get_event_service)):
    events = await event_service.list_events()
    return APIResponse(data=[EventOut.model_validate(e) for e in events])


@router.get("/{event_id}", response_model=APIResponse[EventOut], summary="Get Event Details")
async def get_event(
    event_id: int,
    event_service: EventService = Depends(get_event_service)
):
    event = await event_service.get_event(event_id)
    return APIResponse(data=EventOut.model_validate(event))


@router.get("/{event_id}/tickets", response_model=APIResponse[List[TicketOut]], summary="List Event Seats & Status")
async def list_event_tickets(
    event_id: int,
    event_service: EventService = Depends(get_event_service)
):
    tickets = await event_service.list_tickets(event_id)
    return APIResponse(data=[TicketOut.model_validate(t) for t in tickets])
