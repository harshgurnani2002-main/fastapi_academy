from typing import List
from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_stream_service
from src.services.stream_service import StreamService
from src.schemas.common import APIResponse
from src.schemas.streams import (
    StreamEventPublish, StreamEventOut, StreamConsumeRequest, StreamAckRequest
)

router = APIRouter(prefix="/streams", tags=["Redis Streams & Consumer Groups"])


@router.post("/publish", response_model=APIResponse[dict], status_code=status.HTTP_201_CREATED, summary="XADD Event to Stream")
async def publish_stream_event(
    payload: StreamEventPublish,
    stream_service: StreamService = Depends(get_stream_service)
):
    msg_id = await stream_service.publish(payload.stream_name, payload.event_type, payload.payload)
    return APIResponse(message="Event published to stream", data={"stream": payload.stream_name, "message_id": msg_id})


@router.post("/consume", response_model=APIResponse[List[StreamEventOut]], summary="XREADGROUP Read Stream Batch")
async def consume_stream_events(
    payload: StreamConsumeRequest,
    stream_service: StreamService = Depends(get_stream_service)
):
    events = await stream_service.consume(
        stream_name=payload.stream_name,
        group_name=payload.group_name,
        consumer_name=payload.consumer_name,
        batch_size=payload.batch_size
    )
    return APIResponse(data=[StreamEventOut(id=e["id"], fields=e["fields"]) for e in events])


@router.post("/ack", response_model=APIResponse[dict], summary="XACK Acknowledge Processed Messages")
async def ack_stream_events(
    payload: StreamAckRequest,
    stream_service: StreamService = Depends(get_stream_service)
):
    count = await stream_service.acknowledge(payload.stream_name, payload.group_name, payload.message_ids)
    return APIResponse(message=f"Acknowledged {count} events", data={"acked_count": count})
