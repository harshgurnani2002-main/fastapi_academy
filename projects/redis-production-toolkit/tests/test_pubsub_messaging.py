import pytest
from httpx import AsyncClient
from src.core.redis_client import redis_engine


@pytest.mark.asyncio
async def test_pubsub_realtime_broadcast(client: AsyncClient):
    channel = "live_notifications"

    # Subscriber queue
    sub_queue = redis_engine.subscribe_channel(channel)

    # Publish message via API
    pub_res = await client.post("/api/v1/pubsub/publish", json={
        "channel": channel,
        "message": {"event": "PRICE_DROP", "symbol": "NVDA", "price": 125.50}
    })
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["subscribers_reached"] == 1

    # Verify message received in subscriber queue
    received = await sub_queue.get()
    assert "PRICE_DROP" in received

    redis_engine.unsubscribe_channel(channel, sub_queue)
