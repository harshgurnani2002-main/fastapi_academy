import pytest
from httpx import AsyncClient
from starlette.testclient import TestClient


@pytest.mark.asyncio
async def test_rest_presence_and_broadcast(async_client: AsyncClient, sync_client: TestClient):
    room = "whiteboard-77"

    # Connect WebSocket client
    with sync_client.websocket_connect(f"/ws/rooms/{room}?user_id=usr_sarah&username=Sarah") as ws:
        _ = ws.receive_json()

        # Query presence via REST API
        pres_res = await async_client.get(f"/api/v1/rooms/{room}/presence")
        assert pres_res.status_code == 200
        data = pres_res.json()["data"]
        assert data["total_active_users"] == 1
        assert data["users"][0]["user_id"] == "usr_sarah"

        # Send REST broadcast
        b_res = await async_client.post(f"/api/v1/rooms/{room}/broadcast", json={
            "event_type": "SYSTEM_ALERT",
            "payload": {"announcement": "Scheduled maintenance in 10 mins"}
        })
        assert b_res.status_code == 200

        # Verify WebSocket received the REST broadcast
        received = ws.receive_json()
        assert received["type"] == "SYSTEM_ALERT"
        assert received["payload"]["announcement"] == "Scheduled maintenance in 10 mins"
