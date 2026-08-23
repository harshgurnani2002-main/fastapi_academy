import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_redis_streams_publish_consume_and_ack(client: AsyncClient):
    stream = "order_events"

    # 1. Publish 2 events (XADD)
    p1 = await client.post("/api/v1/streams/publish", json={
        "stream_name": stream,
        "event_type": "order.created",
        "payload": {"order_id": "ORD-101", "amount": 250.0}
    })
    assert p1.status_code == 201
    msg_id_1 = p1.json()["data"]["message_id"]

    p2 = await client.post("/api/v1/streams/publish", json={
        "stream_name": stream,
        "event_type": "order.paid",
        "payload": {"order_id": "ORD-101", "status": "settled"}
    })
    assert p2.status_code == 201
    msg_id_2 = p2.json()["data"]["message_id"]

    # 2. Consumer Group reads batch (XREADGROUP)
    consume_res = await client.post("/api/v1/streams/consume", json={
        "stream_name": stream,
        "group_name": "payment_processors",
        "consumer_name": "worker-1",
        "batch_size": 10
    })
    assert consume_res.status_code == 200
    events = consume_res.json()["data"]
    assert len(events) == 2
    assert events[0]["id"] == msg_id_1

    # 3. Acknowledge messages (XACK)
    ack_res = await client.post("/api/v1/streams/ack", json={
        "stream_name": stream,
        "group_name": "payment_processors",
        "message_ids": [msg_id_1, msg_id_2]
    })
    assert ack_res.status_code == 200
    assert ack_res.json()["data"]["acked_count"] == 2
