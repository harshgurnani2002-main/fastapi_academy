"""
In-Memory Event Bus & Stream Broker
===================================
Senior Design Note:
Simulates Redis Streams / Kafka topic for event publishing and consumer group subscriptions.
"""

import time
import json
from typing import List, Dict, Any, Optional
from collections import defaultdict


class InMemoryEventBus:
    def __init__(self):
        self._streams: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.published_counter = 0

    async def xadd(self, stream_name: str, fields: Dict[str, Any]) -> str:
        msg_id = f"{int(time.time() * 1000)}-{len(self._streams[stream_name])}"
        record = {
            "id": msg_id,
            "fields": fields,
            "published_at": time.time()
        }
        self._streams[stream_name].append(record)
        self.published_counter += 1
        return msg_id

    async def get_stream_records(self, stream_name: str, since_id: Optional[str] = None) -> List[Dict[str, Any]]:
        records = self._streams.get(stream_name, [])
        if not since_id:
            return list(records)
        return [r for r in records if r["id"] > since_id]

    def clear(self):
        self._streams.clear()
        self.published_counter = 0


event_bus = InMemoryEventBus()


def get_event_bus() -> InMemoryEventBus:
    return event_bus
