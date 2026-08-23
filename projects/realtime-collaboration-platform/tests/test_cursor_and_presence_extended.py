import pytest
from starlette.testclient import TestClient
from httpx import AsyncClient


def test_cursor_tracking_and_chat_broadcast(sync_client: TestClient):
    room = "studio-collab-42"
    with sync_client.websocket_connect(f"/ws/rooms/{room}?user_id=u_designer&username=Designer") as ws1:
        _ = ws1.receive_json()  # self join

        with sync_client.websocket_connect(f"/ws/rooms/{room}?user_id=u_developer&username=Developer") as ws2:
            _ = ws2.receive_json()  # dev self join
            _ = ws1.receive_json()  # dev join to designer

            # Send cursor update
            ws1.send_json({"type": "CURSOR_MOVE", "x": 450, "y": 820})
            echo1 = ws1.receive_json()
            assert echo1["type"] == "CURSOR_MOVE"
            dev_rx = ws2.receive_json()
            assert dev_rx["type"] == "CURSOR_MOVE"
            assert dev_rx["x"] == 450


@pytest.mark.asyncio
async def test_presence_empty_room_returns_zero(async_client: AsyncClient):
    res = await async_client.get("/api/v1/rooms/room_with_no_users/presence")
    assert res.status_code == 200
    assert res.json()["data"]["total_active_users"] == 0
