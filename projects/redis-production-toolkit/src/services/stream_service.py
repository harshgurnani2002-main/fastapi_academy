import time
from typing import Dict, Any, List
from src.core.redis_client import AsyncRedisEngine


class StreamService:
    def __init__(self, redis: AsyncRedisEngine):
        self.redis = redis

    async def publish(self, stream_name: str, event_type: str, payload: Dict[str, Any]) -> str:
        fields = {
            "event_type": event_type,
            "payload": payload,
            "published_at": time.time()
        }
        return await self.redis.xadd(stream_name, fields)

    async def consume(
        self,
        stream_name: str,
        group_name: str = "workers",
        consumer_name: str = "worker-1",
        batch_size: int = 5
    ) -> List[Dict[str, Any]]:
        # Ensure group exists
        await self.redis.xgroup_create(stream_name, group_name, id="0", mkstream=True)
        raw_results = await self.redis.xreadgroup(
            groupname=group_name,
            consumername=consumer_name,
            streams={stream_name: ">"},
            count=batch_size
        )
        
        events = []
        for s_name, msgs in raw_results:
            for m_id, m_fields in msgs:
                events.append({"id": m_id, "fields": m_fields})
        return events

    async def acknowledge(self, stream_name: str, group_name: str, message_ids: List[str]) -> int:
        return await self.redis.xack(stream_name, group_name, *message_ids)
