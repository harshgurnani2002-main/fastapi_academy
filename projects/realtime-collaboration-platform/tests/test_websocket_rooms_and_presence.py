import pytest
from starlette.testclient import TestClient


def test_websocket_room_lifecycle_and_presence(sync_client: TestClient):
    room = "canvas-design-101"

    # 1. User Alice connects to room
    with sync_client.websocket_connect(f"/ws/rooms/{room}?user_id=usr_alice&username=Alice") as ws1:
        join_msg = ws1.receive_json()
        assert join_msg["type"] == "USER_JOINED"
        assert join_msg["user_id"] == "usr_alice"

        # 2. User Bob connects to same room
        with sync_client.websocket_connect(f"/ws/rooms/{room}?user_id=usr_bob&username=Bob") as ws2:
            # Bob receives his own join confirmation
            bob_self_join = ws2.receive_json()
            assert bob_self_join["type"] == "USER_JOINED"
            assert bob_self_join["user_id"] == "usr_bob"

            # Alice receives Bob's join notification
            bob_join_for_alice = ws1.receive_json()
            assert bob_join_for_alice["type"] == "USER_JOINED"
            assert bob_join_for_alice["user_id"] == "usr_bob"

            # 3. Alice broadcasts a document edit delta
            ws1.send_json({"type": "DOCUMENT_DELTA", "delta": {"insert": "Hello World"}})

            # Both Alice (echo) and Bob receive the document delta
            alice_echo = ws1.receive_json()
            assert alice_echo["type"] == "DOCUMENT_DELTA"

            bob_delta = ws2.receive_json()
            assert bob_delta["type"] == "DOCUMENT_DELTA"
            assert bob_delta["delta"]["insert"] == "Hello World"

        # 4. Bob disconnects -> Alice receives USER_LEFT notification
        leave_msg = ws1.receive_json()
        assert leave_msg["type"] == "USER_LEFT"
        assert leave_msg["user_id"] == "usr_bob"
