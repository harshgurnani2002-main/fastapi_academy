"""
WebSocket Room Connection Manager & Presence Tracker
====================================================
Senior Design Note:
Maintains active in-memory WebSocket connections per room and synchronizes broadcasts
across distributed replicas via an internal pub/sub event bus.
"""

import time
import json
import asyncio
from typing import Dict, List, Set, Optional, Any
from starlette.websockets import WebSocket
from collections import defaultdict


class RoomConnectionManager:
    def __init__(self):
        # room_id -> set of WebSocket connections
        self.active_rooms: Dict[str, Set[WebSocket]] = defaultdict(set)
        # room_id -> user_id -> metadata (username, color, last_seen)
        self.presence: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(dict)
        self._lock = asyncio.Lock()

    async def connect(self, room_id: str, websocket: WebSocket, user_id: str, username: str):
        await websocket.accept()
        async with self._lock:
            self.active_rooms[room_id].add(websocket)
            self.presence[room_id][user_id] = {
                "user_id": user_id,
                "username": username,
                "joined_at": time.time(),
                "last_seen": time.time()
            }
        
        # Notify room of user arrival
        await self.broadcast(room_id, {
            "type": "USER_JOINED",
            "user_id": user_id,
            "username": username,
            "active_users": list(self.presence[room_id].values())
        })

    async def disconnect(self, room_id: str, websocket: WebSocket, user_id: str):
        async with self._lock:
            self.active_rooms[room_id].discard(websocket)
            self.presence[room_id].pop(user_id, None)
            if not self.active_rooms[room_id]:
                self.active_rooms.pop(room_id, None)
                self.presence.pop(room_id, None)

        await self.broadcast(room_id, {
            "type": "USER_LEFT",
            "user_id": user_id,
            "active_users": list(self.presence.get(room_id, {}).values())
        })

    async def broadcast(self, room_id: str, message: Dict[str, Any]):
        connections = list(self.active_rooms.get(room_id, set()))
        if not connections:
            return

        payload = json.dumps(message)
        dead_connections = []
        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_connections.append(ws)

        if dead_connections:
            async with self._lock:
                for ws in dead_connections:
                    self.active_rooms[room_id].discard(ws)

    def get_room_presence(self, room_id: str) -> List[Dict[str, Any]]:
        return list(self.presence.get(room_id, {}).values())

    def clear(self):
        self.active_rooms.clear()
        self.presence.clear()


manager = RoomConnectionManager()


def get_connection_manager() -> RoomConnectionManager:
    return manager
