from fastapi import APIRouter, Depends
from src.core.dependencies import get_order_service
from src.services.order_service import OrderEventService
from src.schemas.common import APIResponse
from src.schemas.events import OutboxRelayResponse, EventConsumeRequest, EventConsumeResponse

router = APIRouter(prefix="/events", tags=["Outbox Relay & Event Consumers"])


@router.post("/relay", response_model=APIResponse[OutboxRelayResponse], summary="Relay Pending Outbox Events to Stream")
async def relay_outbox(service: OrderEventService = Depends(get_order_service)):
    stream_name = "stream:orders"
    relayed_ids = await service.relay_outbox_events(stream_name)
    return APIResponse(
        message=f"Relayed {len(relayed_ids)} outbox events to {stream_name}",
        data=OutboxRelayResponse(
            events_relayed=len(relayed_ids),
            stream_name=stream_name,
            event_ids=relayed_ids
        )
    )


@router.post("/consume", response_model=APIResponse[EventConsumeResponse], summary="Idempotent Stream Event Consumer")
async def consume_events(
    payload: EventConsumeRequest,
    service: OrderEventService = Depends(get_order_service)
):
    res = await service.consume_events_idempotently(payload.stream_name, payload.consumer_name)
    return APIResponse(
        message="Consumer finished event stream processing",
        data=EventConsumeResponse(
            events_processed=res["processed"],
            duplicates_skipped=res["duplicates"],
            consumer=payload.consumer_name
        )
    )


@router.get("/stream/records", response_model=APIResponse[list], summary="Inspect Event Stream")
async def inspect_stream(stream_name: str = "stream:orders", service: OrderEventService = Depends(get_order_service)):
    records = await service.bus.get_stream_records(stream_name)
    return APIResponse(data=records)
