from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, status
from src.core.connection_manager import RoomConnectionManager, get_connection_manager
from src.schemas.common import APIResponse
from src.schemas.collaboration import RoomBroadcastRequest, RoomPresenceResponse, UserPresence
import json

router = APIRouter(tags=["Real-Time Collaboration & WebSockets"])


@router.websocket("/ws/rooms/{room_id}")
async def websocket_room_endpoint(
    websocket: WebSocket,
    room_id: str,
    user_id: str = Query(..., min_length=1),
    username: str = Query(default="Anonymous Member"),
    manager: RoomConnectionManager = Depends(get_connection_manager)
):
    await manager.connect(room_id, websocket, user_id, username)
    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except Exception:
                data = {"type": "RAW_MESSAGE", "content": raw_text}

            data["sender_id"] = user_id
            data["sender_name"] = username
            await manager.broadcast(room_id, data)
    except WebSocketDisconnect:
        await manager.disconnect(room_id, websocket, user_id)


@router.post("/api/v1/rooms/{room_id}/broadcast", response_model=APIResponse[dict], summary="REST Broadcast to Room")
async def broadcast_to_room(
    room_id: str,
    payload: RoomBroadcastRequest,
    manager: RoomConnectionManager = Depends(get_connection_manager)
):
    msg = {
        "type": payload.event_type,
        "sender_id": payload.sender_id,
        "payload": payload.payload
    }
    await manager.broadcast(room_id, msg)
    return APIResponse(
        message=f"Broadcast sent to room '{room_id}'",
        data={"room_id": room_id, "recipients_count": len(manager.active_rooms.get(room_id, set()))}
    )


@router.get("/api/v1/rooms/{room_id}/presence", response_model=APIResponse[RoomPresenceResponse], summary="Get Active Users in Room")
async def get_presence(
    room_id: str,
    manager: RoomConnectionManager = Depends(get_connection_manager)
):
    presence_list = manager.get_room_presence(room_id)
    users = [UserPresence(**u) for u in presence_list]
    return APIResponse(
        data=RoomPresenceResponse(
            room_id=room_id,
            total_active_users=len(users),
            users=users
        )
    )
