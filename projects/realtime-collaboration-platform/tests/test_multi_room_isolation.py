import pytest
from starlette.testclient import TestClient


def test_multi_room_isolation(sync_client: TestClient):
    room_alpha = "room-alpha"
    room_beta = "room-beta"

    with sync_client.websocket_connect(f"/ws/rooms/{room_alpha}?user_id=u1&username=User1") as ws_a:
        _ = ws_a.receive_json()  # self join

        with sync_client.websocket_connect(f"/ws/rooms/{room_beta}?user_id=u2&username=User2") as ws_b:
            _ = ws_b.receive_json()  # self join

            # Send broadcast in Room Beta
            ws_b.send_json({"type": "CHAT", "text": "Beta secret message"})
            beta_echo = ws_b.receive_json()
            assert beta_echo["type"] == "CHAT"

            # Verify Room Alpha did NOT receive Beta's message by sending its own message
            ws_a.send_json({"type": "CHAT", "text": "Alpha message"})
            alpha_msg = ws_a.receive_json()
            assert alpha_msg["text"] == "Alpha message"
