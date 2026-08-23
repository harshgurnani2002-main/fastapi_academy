from fastapi import APIRouter, Depends
from src.core.redis_client import AsyncRedisEngine, get_redis
from src.schemas.common import APIResponse
from src.schemas.pubsub import PublishMessageRequest, PublishMessageResponse

router = APIRouter(prefix="/pubsub", tags=["Real-Time Pub/Sub"])


@router.post("/publish", response_model=APIResponse[PublishMessageResponse], summary="Publish Message to Channel")
async def publish_message(
    payload: PublishMessageRequest,
    redis: AsyncRedisEngine = Depends(get_redis)
):
    import json
    msg_str = json.dumps(payload.message) if not isinstance(payload.message, str) else payload.message
    receivers = await redis.publish(payload.channel, msg_str)
    return APIResponse(
        message=f"Broadcasted to channel '{payload.channel}'",
        data=PublishMessageResponse(channel=payload.channel, subscribers_reached=receivers)
    )
