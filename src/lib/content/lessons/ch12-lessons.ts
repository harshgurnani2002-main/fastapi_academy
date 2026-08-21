import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch12Lessons: Record<string, Lesson> = {
  'websocket-protocol': {
    id: '12-01',
    slug: 'websocket-protocol',
    chapterId: 12,
    order: 1,
    title: 'WebSocket Protocol & ASGI Lifecycle',
    description: 'Understand the HTTP-to-WebSocket upgrade process and the ASGI lifecycle of real-time connections.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.websockets],
    prerequisites: ['11-05'],
    objectives: [
      'Explain the HTTP→WebSocket upgrade handshake',
      'Handle connect, receive, send, disconnect in ASGI',
      'Use FastAPI WebSocket endpoint correctly',
      'Inspect WebSocket frames with browser devtools'
    ],
    sections: [
      {
        id: 'upgrade-handshake',
        type: 'concept',
        title: 'The HTTP to WebSocket Upgrade',
        content: `WebSockets do not start as WebSockets. They begin as a standard HTTP/1.1 request. The client sends a GET request to the server with special headers: \`Connection: Upgrade\` and \`Upgrade: websocket\`, along with a \`Sec-WebSocket-Key\`. If the server supports WebSockets, it responds with a \`101 Switching Protocols\` status code.

This 101 response confirms that the server agrees to switch the protocol on this exact TCP connection. The connection is no longer HTTP; it is now a full-duplex WebSocket stream where both client and server can push frames at any time.

In ASGI (and FastAPI), this manifests as a different scope type. HTTP requests have a \`type: http\`, but WebSockets have \`type: websocket\`. FastAPI abstracts the raw ASGI messages (\`websocket.connect\`, \`websocket.receive\`, \`websocket.send\`, \`websocket.disconnect\`) into a cleaner \`WebSocket\` class.`
      },
      {
        id: 'asgi-lifecycle',
        type: 'implementation',
        title: 'Handling the WebSocket Lifecycle in FastAPI',
        content: `A FastAPI WebSocket endpoint must explicitly accept the connection, loop to receive messages, and handle disconnection exceptions gracefully. If you do not call \`await websocket.accept()\`, the connection will be dropped.

When a client disconnects, FastAPI raises a \`WebSocketDisconnect\` exception. It is absolutely critical to catch this exception to clean up resources, update presence, or remove the client from connection managers. Failing to catch this exception can cause application crashes or resource leaks.`
      },
      {
        id: 'inspecting-frames',
        type: 'production',
        title: 'Inspecting WebSocket Frames',
        content: `Unlike HTTP requests where you can easily see headers and body in the network tab, WebSockets transmit data in "frames" (Text, Binary, Ping, Pong, Close). Modern browser DevTools allow you to click on the 101 HTTP upgrade request and view the "Messages" or "WS" tab.

In production, since WebSockets are long-lived, traditional HTTP access logs will only show the initial 101 request. To monitor WebSocket activity, you must implement application-level logging or metrics for incoming/outgoing frames and active connection counts.`
      }
    ],
    codeExamples: [
      {
        id: 'basic-websocket',
        title: 'Basic WebSocket Endpoint',
        files: {
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import logging

app = FastAPI()
logger = logging.getLogger(__name__)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # 1. Wait for connection and accept it
    await websocket.accept()
    logger.info(f"Client connected: {websocket.client}")
    
    try:
        # 2. Infinite loop to keep connection alive and process messages
        while True:
            # Receive text data from client
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")
            
            # Send text data back to client
            await websocket.send_text(f"Message text was: {data}")
            
    except WebSocketDisconnect as e:
        # 3. Handle client disconnection
        logger.info(f"Client disconnected with code {e.code}")
    except Exception as e:
        # Catch unexpected errors to prevent app crashes
        logger.error(f"WebSocket error: {e}")
        # Optionally try to close cleanly if still open
        try:
            await websocket.close(code=1011, reason="Internal Server Error")
        except RuntimeError:
            pass`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'echo-json',
        title: 'JSON Echo Server',
        description: 'Modify the basic WebSocket endpoint to receive JSON data, append a server timestamp to the JSON payload, and send it back as JSON.',
        hint: 'Use `await websocket.receive_json()` and `await websocket.send_json()`.',
        solution: 'Using the built-in JSON methods handles serialization and deserialization automatically.',
        solutionCode: {
          id: 'echo-json-solution',
          language: 'python',
          title: 'Solution',
          filename: 'main.py',
          code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone

app = FastAPI()

@app.websocket("/ws/json")
async def json_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive and parse JSON automatically
            payload = await websocket.receive_json()
            
            # Mutate payload
            payload["server_time"] = datetime.now(timezone.utc).isoformat()
            
            # Send back as JSON string
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-ws-upgrade',
        question: 'Explain the process of how an HTTP connection becomes a WebSocket connection.',
        answer: 'The client sends an HTTP GET request with `Connection: Upgrade` and `Upgrade: websocket` headers. If the server supports WebSockets, it responds with an HTTP 101 Switching Protocols status code. After this handshake, the TCP connection remains open and the protocol switches from HTTP to the WebSocket protocol, allowing full-duplex communication.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-ws-disconnect',
        question: 'Why must you wrap your WebSocket `receive` loop in a try/except block specifically catching `WebSocketDisconnect`?',
        answer: 'Because when a client closes the connection, the next `receive()` call will raise a `WebSocketDisconnect` exception in FastAPI/Starlette. If uncaught, this exception bubbles up and can cause errors in your logs. Catching it allows you to gracefully clean up server-side resources, like removing the client from a connection manager.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-ws-logging',
        severity: 'warning',
        content: 'Standard HTTP access logs will not show the volume of messages sent over a WebSocket, only the initial handshake. You must implement custom instrumentation to track message throughput.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'connection-management': {
    id: '12-02',
    slug: 'connection-management',
    chapterId: 12,
    order: 2,
    title: 'Connection Management & Registration',
    description: 'Learn how to manage state for active WebSocket connections, enabling broadcasting and targeted messaging.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.websockets, technologies.python],
    prerequisites: ['12-01'],
    objectives: [
      'Implement a WebSocket connection manager',
      'Handle concurrent connection registration',
      'Clean up disconnected clients automatically',
      'Monitor active connection count'
    ],
    sections: [
      {
        id: 'why-manager',
        type: 'concept',
        title: 'Why You Need a Connection Manager',
        content: `A single WebSocket endpoint function only knows about the one \`websocket\` object passed to it. If User A sends a message and you want to route it to User B, the endpoint handling User A needs a way to find User B's connection object.

A Connection Manager is an in-memory state store (typically a singleton instance of a class) that keeps track of all active connections. It usually maintains a dictionary mapping user IDs or connection IDs to \`WebSocket\` objects, or simply a list of active connections for broadcasting.`
      },
      {
        id: 'manager-design',
        type: 'architecture',
        title: 'Designing the Manager',
        content: `A robust connection manager needs methods to \`connect\`, \`disconnect\`, \`send_personal_message\`, and \`broadcast\`. 

In an asynchronous environment like FastAPI, adding and removing items from standard Python dictionaries and lists is generally thread-safe due to the Global Interpreter Lock (GIL) and single-threaded asyncio event loop. However, you must be careful not to iterate over a collection while it is mutating (e.g., if an awaited \`send\` yields control, and another client disconnects).`
      },
      {
        id: 'broadcasting-safely',
        type: 'implementation',
        title: 'Broadcasting Safely',
        content: `When broadcasting to multiple clients, if one client connection is dropped but not yet removed from the manager, attempting to send to it will raise an exception. Your broadcasting logic must gracefully handle these exceptions, optionally cleaning up the broken connections on the fly.`
      }
    ],
    codeExamples: [
      {
        id: 'connection-manager-code',
        title: 'Robust Connection Manager',
        files: {
          'app/ws/manager.py': {
            language: 'python',
            code: `from fastapi import WebSocket
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of their active WebSocket connections
        # (Users might be connected from multiple tabs/devices)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Total connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            # Cleanup empty lists
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            # Send to all connections of this user
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to {user_id}: {e}")
                    # In a real app, you might want to call disconnect() here

    async def broadcast(self, message: str):
        # Create a snapshot of connections to iterate over safely
        for user_id, connections in list(self.active_connections.items()):
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to broadcast to {user_id}: {e}")

# Singleton instance
manager = ConnectionManager()`
          },
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.ws.manager import manager

app = FastAPI()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back to the specific user
            await manager.send_personal_message(f"You wrote: {data}", user_id)
            # Announce to everyone else
            await manager.broadcast(f"User {user_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        await manager.broadcast(f"User {user_id} left the chat")`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'manager-count',
        title: 'Connection Statistics',
        description: 'Add a method to the `ConnectionManager` that returns the total number of unique users connected and the total number of raw WebSocket connections.',
        hint: 'You need to count the keys for users, and sum the lengths of the lists for total connections.',
        solution: 'Iterating over the dictionary values and summing their lengths.',
        solutionCode: {
          id: 'manager-count-sol',
          language: 'python',
          title: 'Solution',
          filename: 'manager.py',
          code: `def get_stats(self) -> dict:
    total_users = len(self.active_connections)
    total_connections = sum(len(conns) for conns in self.active_connections.values())
    return {
        "users_online": total_users,
        "active_sockets": total_connections
    }`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-manager-mem',
        severity: 'warning',
        content: 'An in-memory connection manager only works for a single FastAPI process. If you run multiple Uvicorn workers or multiple containers, a message sent to a user on Worker A cannot reach a user connected to Worker B. You will need a Pub/Sub backend (like Redis) for multi-process broadcasting.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-iteration',
        scenario: 'Dictionary changed size during iteration',
        problem: 'Broadcasting to clients failed with `RuntimeError: dictionary changed size during iteration`. The broadcast loop was iterating over `manager.active_connections.keys()` while another async task was removing a disconnected user.',
        solution: 'Iterate over a copy/snapshot of the dictionary items using `list(self.active_connections.items())`.'
      }
    ],
    commonMistakes: []
  },
  'websocket-authentication': {
    id: '12-03',
    slug: 'websocket-authentication',
    chapterId: 12,
    order: 3,
    title: 'Authenticating WebSocket Connections',
    description: 'Learn how to securely authenticate WebSockets using JWTs via query parameters or cookies.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.jwt, technologies.websockets],
    prerequisites: ['12-02'],
    objectives: [
      'Authenticate via JWT in WebSocket query params',
      'Validate auth cookies on WebSocket connect',
      'Reject unauthenticated connections with 4001 close code',
      'Refresh token handling over WebSockets'
    ],
    sections: [
      {
        id: 'ws-auth-challenge',
        type: 'concept',
        title: 'The Challenge of WebSocket Auth',
        content: `Standard HTTP requests use the \`Authorization: Bearer <token>\` header for JWTs. However, the browser's built-in \`WebSocket\` API in JavaScript **does not allow setting custom headers** during the connection handshake. 

This forces us to pass authentication credentials in one of two ways:
1. **Query Parameters**: \`ws://server/ws?token=ey...\`
2. **Cookies**: The browser automatically sends cookies with the WebSocket upgrade request.
3. **First Message**: The socket connects unauthenticated, and the client immediately sends a JSON payload with the token. (The server drops the connection if not received within X seconds).`
      },
      {
        id: 'auth-implementation',
        type: 'implementation',
        title: 'Rejecting Unauthorized Connections',
        content: `When rejecting a WebSocket connection in FastAPI, you cannot simply return an HTTP 401 response (though ASGI technically supports rejecting the HTTP handshake, FastAPI's \`WebSocket\` class abstracts this). 

Instead, you should \`close()\` the websocket with a specific close code (e.g., 4000+ for application-specific codes) or an HTTP exception *before* calling \`await websocket.accept()\`. Actually, FastAPI handles \`WebSocketException\` to close the socket with an appropriate code.`
      }
    ],
    codeExamples: [
      {
        id: 'ws-auth-query',
        title: 'JWT Auth via Query Parameter',
        files: {
          'app/dependencies.py': {
            language: 'python',
            code: `from fastapi import Query, WebSocket, WebSocketException, status
import jwt
from typing import Optional

SECRET_KEY = "your-secret-key"

async def get_current_user_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
) -> str:
    if token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        return user_id
    except jwt.InvalidTokenError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")`
          },
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, WebSocket, Depends
from app.dependencies import get_current_user_ws

app = FastAPI()

@app.websocket("/ws")
async def secure_ws(
    websocket: WebSocket,
    user_id: str = Depends(get_current_user_ws)
):
    # If the dependency passes, we accept the connection
    await websocket.accept()
    await websocket.send_text(f"Welcome securely, {user_id}!")
    
    # ... handle messages ...`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ws-auth-cookie',
        title: 'Cookie-based WebSocket Auth',
        description: 'Modify the dependency to read the JWT from a cookie named `session_token` instead of a query parameter.',
        hint: 'Use `fastapi.Cookie` instead of `Query`.',
        solution: 'WebSockets support the Cookie dependency injection perfectly since the initial handshake is standard HTTP.',
        solutionCode: {
          id: 'cookie-ws-sol',
          language: 'python',
          title: 'Solution',
          filename: 'dependencies.py',
          code: `from fastapi import Cookie, WebSocket, WebSocketException, status

async def get_current_user_ws_cookie(
    websocket: WebSocket,
    session_token: str | None = Cookie(None)
) -> str:
    if session_token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    # validate session_token...
    return "user-id"`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-token-logs',
        severity: 'critical',
        content: 'If you use query parameters for WebSocket auth (`?token=...`), be aware that the token will be logged in your proxy/load balancer access logs (like Nginx). Cookie-based auth or "first message" auth is more secure against log leakage.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'rooms-channels': {
    id: '12-04',
    slug: 'rooms-channels',
    chapterId: 12,
    order: 4,
    title: 'Rooms & Channels',
    description: 'Implement complex WebSocket routing by categorizing connections into dynamic rooms and private channels.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.websockets],
    prerequisites: ['12-02'],
    objectives: [
      'Design the room membership data structure',
      'Broadcast messages to all room members',
      'Handle room join/leave events',
      'Implement private messaging between users'
    ],
    sections: [
      {
        id: 'room-design',
        type: 'concept',
        title: 'Modeling Rooms in Memory',
        content: `A "room" or "channel" allows grouping connections. Instead of broadcasting to everyone, you broadcast to a subset.

To model this in an in-memory manager, you typically map a \`room_id\` to a \`Set\` or \`List\` of WebSockets. When a user joins a room, their socket is added to that room's collection. When they leave or disconnect, it is removed.

A single connection can belong to multiple rooms simultaneously (e.g., a "global" room, a "tenant-specific" room, and "private-chat-123").`
      },
      {
        id: 'room-implementation',
        type: 'implementation',
        title: 'Building the Room Manager',
        content: `We extend our connection manager to maintain an additional data structure: \`rooms: Dict[str, Set[WebSocket]]\`. A \`Set\` is preferred over a \`List\` because a socket can only be in a room once, and \`remove()\` operations on sets are O(1) compared to O(N) for lists.`
      }
    ],
    codeExamples: [
      {
        id: 'room-manager',
        title: 'Room-based Connection Manager',
        files: {
          'app/ws/rooms.py': {
            language: 'python',
            code: `from fastapi import WebSocket
from typing import Dict, Set
import logging

logger = logging.getLogger(__name__)

class RoomManager:
    def __init__(self):
        # Map room_id -> set of active WebSockets
        self.rooms: Dict[str, Set[WebSocket]] = {}

    async def join_room(self, room_id: str, websocket: WebSocket):
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)
        logger.info(f"Socket joined room {room_id}. Total members: {len(self.rooms[room_id])}")

    def leave_room(self, room_id: str, websocket: WebSocket):
        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
    def remove_from_all(self, websocket: WebSocket):
        # We must copy keys because we might delete empty rooms during iteration
        for room_id in list(self.rooms.keys()):
            self.leave_room(room_id, websocket)

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.rooms:
            # Snapshot the set for safe iteration
            for connection in list(self.rooms[room_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    self.leave_room(room_id, connection)

room_manager = RoomManager()`
          },
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.ws.rooms import room_manager

app = FastAPI()

@app.websocket("/ws/chat/{room_id}")
async def chat_room(websocket: WebSocket, room_id: str):
    await websocket.accept()
    await room_manager.join_room(room_id, websocket)
    
    try:
        # Announce join
        await room_manager.broadcast_to_room(room_id, {"event": "join", "message": "A new user joined"})
        
        while True:
            data = await websocket.receive_text()
            await room_manager.broadcast_to_room(room_id, {"event": "message", "message": data})
            
    except WebSocketDisconnect:
        room_manager.remove_from_all(websocket)
        await room_manager.broadcast_to_room(room_id, {"event": "leave", "message": "A user left"})`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-dynamic-rooms',
        title: 'Dynamic Room Subscriptions',
        description: 'Update the endpoint so a user connects to a single `/ws` endpoint, and can dynamically join/leave rooms by sending JSON messages like `{"action": "join", "room": "sales"}`.',
        hint: 'Use `await websocket.receive_json()`, parse the action, and call `room_manager.join_room` dynamically inside the loop.',
        solution: 'This multiplexing approach is standard in production. One socket handles multiple subscriptions.',
        solutionCode: {
          id: 'sol-dynamic-rooms',
          language: 'python',
          title: 'Solution',
          filename: 'main.py',
          code: `while True:
    data = await websocket.receive_json()
    action = data.get("action")
    room = data.get("room")
    
    if action == "join":
        await room_manager.join_room(room, websocket)
    elif action == "leave":
        room_manager.leave_room(room, websocket)
    elif action == "send":
        await room_manager.broadcast_to_room(room, {"msg": data.get("msg")})`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'redis-pubsub-scaling': {
    id: '12-05',
    slug: 'redis-pubsub-scaling',
    chapterId: 12,
    order: 5,
    title: 'Scaling WebSockets with Redis Pub/Sub',
    description: 'Break out of the single-process limitation by using Redis Pub/Sub to synchronize WebSocket broadcasts across multiple FastAPI instances.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi, technologies.websockets],
    prerequisites: ['12-04'],
    objectives: [
      'Connect Redis Pub/Sub to WebSocket broadcasts',
      'Subscribe to channels in background asyncio tasks',
      'Handle Redis connection failures gracefully',
      'Test multi-instance WebSocket broadcasting'
    ],
    sections: [
      {
        id: 'the-scaling-problem',
        type: 'concept',
        title: 'The Stateful Scaling Problem',
        content: `Standard HTTP requests are stateless; any load balancer can route a request to any worker. WebSockets are stateful. If User A connects to Worker 1, and User B connects to Worker 2, they cannot talk to each other using an in-memory \`ConnectionManager\`. Worker 1 does not know User B exists.

To solve this, we introduce a distributed message broker like Redis. When User A sends a message to a room, Worker 1 publishes that message to a Redis channel. Worker 1, Worker 2, and all other workers are subscribed to that Redis channel. When Redis broadcasts the message to all workers, each worker checks its own in-memory manager to see if any connected users are in that room, and forwards the message to them.`
      },
      {
        id: 'redis-pubsub-arch',
        type: 'architecture',
        title: 'Redis Pub/Sub Architecture',
        content: `The architecture involves an asyncio background task running continuously alongside your FastAPI app. This task listens to Redis channels.

\`\`\`mermaid
flowchart LR
    C1[Client A] <-->|WS| W1(Worker 1)
    C2[Client B] <-->|WS| W2(Worker 2)
    W1 -->|Publish| R[(Redis)]
    R -->|Subscribe Push| W1
    R -->|Subscribe Push| W2
    W2 -->|Forward WS| C2
\`\`\``
      }
    ],
    codeExamples: [
      {
        id: 'redis-broadcaster',
        title: 'Redis Broadcaster Implementation',
        files: {
          'app/redis_client.py': {
            language: 'python',
            code: `import redis.asyncio as redis
import json
from app.ws.rooms import room_manager
import logging

logger = logging.getLogger(__name__)

# Redis client
redis_conn = redis.from_url("redis://localhost")

async def publish_to_room(room_id: str, message: dict):
    """Called by the WS endpoint when a user sends a message"""
    payload = json.dumps({"room_id": room_id, "data": message})
    await redis_conn.publish("global_chat_channel", payload)

async def redis_listener():
    """Background task that listens for Redis messages and routes them to local WebSockets"""
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe("global_chat_channel")
    logger.info("Subscribed to Redis global_chat_channel")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                payload = json.loads(message["data"])
                room_id = payload["room_id"]
                data = payload["data"]
                # Forward to local connected users in this room
                await room_manager.broadcast_to_room(room_id, data)
    except Exception as e:
        logger.error(f"Redis listener error: {e}")`
          },
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, WebSocket
import asyncio
from contextlib import asynccontextmanager
from app.redis_client import redis_listener, publish_to_room, redis_conn
from app.ws.rooms import room_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Redis listener as background task
    listener_task = asyncio.create_task(redis_listener())
    yield
    # Cleanup
    listener_task.cancel()
    await redis_conn.aclose()

app = FastAPI(lifespan=lifespan)

@app.websocket("/ws/chat/{room_id}")
async def chat_ws(websocket: WebSocket, room_id: str):
    await websocket.accept()
    await room_manager.join_room(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Publish to Redis instead of local broadcast
            await publish_to_room(room_id, {"text": data})
    except Exception:
        room_manager.leave_room(room_id, websocket)`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-redis-disconnect',
        severity: 'critical',
        content: 'If the Redis connection drops, your `pubsub.listen()` loop will raise an exception and exit. Your background task must include a `while True` loop with a try/except block to automatically reconnect and resubscribe to Redis.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'presence-system': {
    id: '12-06',
    slug: 'presence-system',
    chapterId: 12,
    order: 6,
    title: 'Online Presence System',
    description: 'Build a system to track user online/offline status and typing indicators using Redis.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi, technologies.websockets],
    prerequisites: ['12-05'],
    objectives: [
      'Store presence state in Redis sorted sets',
      'Broadcast presence changes to interested clients',
      'Expire stale presence entries automatically',
      'Display typing indicators and read receipts'
    ],
    sections: [
      {
        id: 'presence-concept',
        type: 'concept',
        title: 'Designing Global Presence',
        content: `Presence (knowing if a user is "online", "away", or "offline") in a distributed system is challenging. You cannot rely on an in-memory manager because User A's connection state lives on Worker 1, but User B (on Worker 2) needs to see User A's status.

The standard pattern is to use Redis. When a user connects, we write a key to Redis \`SET user:123:status "online"\` with an expiration (TTL) of 30 seconds. The WebSocket connection then sends periodic "heartbeats" (pings) every 15 seconds to refresh this TTL. If the user disconnects abruptly and the server crashes, the TTL expires and the user is naturally marked offline.`
      }
    ],
    codeExamples: [
      {
        id: 'presence-code',
        title: 'Redis Presence with Heartbeats',
        files: {
          'app/presence.py': {
            language: 'python',
            code: `import redis.asyncio as redis
import time

redis_conn = redis.from_url("redis://localhost")
PRESENCE_TTL = 30 # seconds

async def mark_online(user_id: str):
    # Set status and publish change if they were offline
    was_online = await redis_conn.exists(f"user:{user_id}:status")
    await redis_conn.setex(f"user:{user_id}:status", PRESENCE_TTL, "online")
    
    if not was_online:
        await redis_conn.publish("presence_events", f"{user_id}:online")

async def mark_offline(user_id: str):
    await redis_conn.delete(f"user:{user_id}:status")
    await redis_conn.publish("presence_events", f"{user_id}:offline")`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'heartbeats-reconnection': {
    id: '12-07',
    slug: 'heartbeats-reconnection',
    chapterId: 12,
    order: 7,
    title: 'Heartbeats & Client Reconnection',
    description: 'Implement ping/pong mechanisms and resilient reconnection logic for unstable networks.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.websockets],
    prerequisites: ['12-01'],
    objectives: [
      'Implement server-side ping/pong heartbeats',
      'Detect and close zombie connections',
      'Implement client-side exponential backoff reconnection',
      'Resume subscription state after reconnection'
    ],
    sections: [
      {
        id: 'zombie-conns',
        type: 'concept',
        title: 'The Zombie Connection Problem',
        content: `In standard TCP, if a client loses network connection (e.g., driving through a tunnel) without sending a proper TCP FIN packet, the server does not immediately know the client is gone. The connection stays open in memory, holding resources—a "zombie connection."

To detect this, WebSockets implement a Ping/Pong frame protocol. The server periodically sends a Ping frame. If the client does not reply with a Pong frame within a timeout, the server assumes the client is dead and forcefully closes the connection.`
      },
      {
        id: 'fastapi-pings',
        type: 'implementation',
        title: 'Ping/Pong in ASGI',
        content: `FastAPI/Starlette (via standard ASGI servers like Uvicorn) usually handles raw Ping/Pong frames automatically under the hood if configured, but you can also implement application-level heartbeats by sending explicit JSON messages like \`{"type": "ping"}\` and expecting \`{"type": "pong"}\`.`
      }
    ],
    codeExamples: [
      {
        id: 'app-heartbeat',
        title: 'Application-Level Heartbeat',
        files: {
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, WebSocket
import asyncio

app = FastAPI()

async def ping_loop(websocket: WebSocket):
    while True:
        await asyncio.sleep(20) # Ping every 20s
        try:
            await websocket.send_json({"type": "ping"})
        except Exception:
            break # Socket closed

@app.websocket("/ws")
async def ws_with_heartbeat(websocket: WebSocket):
    await websocket.accept()
    
    # Start background ping task for this connection
    pinger = asyncio.create_task(ping_loop(websocket))
    
    try:
        while True:
            # We enforce a timeout. If no message OR pong received in 30s, we close.
            data = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
            if data.get("type") == "pong":
                # Heartbeat acknowledged, loop continues and resets the wait_for timer
                continue
            
            # Process normal messages...
            pass
    except asyncio.TimeoutError:
        # Client didn't respond to ping or send data for 30s
        await websocket.close(code=1011, reason="Timeout")
    finally:
        pinger.cancel()`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'backpressure-slow-clients': {
    id: '12-08',
    slug: 'backpressure-slow-clients',
    chapterId: 12,
    order: 8,
    title: 'Backpressure & Slow Clients',
    description: 'Handle fast producers and slow consumers gracefully to prevent memory exhaustion.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.websockets, technologies.python],
    prerequisites: ['12-02'],
    objectives: [
      'Detect slow clients with send queue length',
      'Implement message buffering with size limits',
      'Drop messages for lagging clients',
      'Apply per-connection send rate limits'
    ],
    sections: [
      {
        id: 'backpressure-intro',
        type: 'concept',
        title: 'Understanding Backpressure',
        content: `If your server generates messages at 1,000 per second (e.g., market data ticker), but a client on a slow 3G network can only receive 100 per second, what happens? 

The OS TCP send buffers fill up. Then the Python ASGI send buffers fill up. \`await websocket.send_text()\` will block, causing your broadcast loop to pause, which freezes the feed for *all other fast clients*. This is catastrophic in real-time systems.

You must implement backpressure handling: queuing messages per client, dropping stale messages, or disconnecting clients that lag too far behind.`
      }
    ],
    codeExamples: [
      {
        id: 'asyncio-queue',
        title: 'Per-Client Asyncio Queue',
        files: {
          'app/ws/client.py': {
            language: 'python',
            code: `import asyncio
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ClientConnection:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        # Buffer up to 100 messages. Beyond this, we drop.
        self.queue = asyncio.Queue(maxsize=100)
        self.sender_task = asyncio.create_task(self._send_loop())

    async def enqueue(self, message: str):
        try:
            # put_nowait raises QueueFull if the client is too slow
            self.queue.put_nowait(message)
        except asyncio.QueueFull:
            logger.warning("Client lagging! Dropping message.")
            # Alternatively: drop oldest message to make room, or disconnect client.

    async def _send_loop(self):
        try:
            while True:
                message = await self.queue.get()
                await self.websocket.send_text(message)
                self.queue.task_done()
        except Exception:
            pass # Handle cleanup
            
    def cancel(self):
        self.sender_task.cancel()`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-slow-client',
        severity: 'critical',
        content: 'Never `await` directly in a generic broadcast loop over many clients if message volume is high. One slow client will block the loop and throttle everyone. Always use background tasks or bounded queues per connection.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'websocket-testing': {
    id: '12-09',
    slug: 'websocket-testing',
    chapterId: 12,
    order: 9,
    title: 'Testing WebSocket Endpoints',
    description: 'Learn how to write deterministic, reliable integration tests for WebSockets using Pytest and HTTPX.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.pytest],
    prerequisites: ['12-01'],
    objectives: [
      'Use HTTPX WebSocket client for tests',
      'Test authentication over WebSockets',
      'Test broadcast to multiple connections',
      'Test reconnection and heartbeat behavior'
    ],
    sections: [
      {
        id: 'testclient-ws',
        type: 'concept',
        title: 'FastAPI TestClient & WebSockets',
        content: `FastAPI's \`TestClient\` (which wraps Starlette's TestClient) provides a context manager for testing WebSockets synchronously. It bypasses the network and invokes ASGI directly, making tests fast and deterministic.

\`\`\`python
with client.websocket_connect("/ws") as websocket:
    websocket.send_text("Hello")
    data = websocket.receive_text()
    assert data == "Echo: Hello"
\`\`\`

For more complex async testing or testing multiple simultaneous connections, you may need an async HTTPX client equipped with ASGI WebSocket transport.`
      }
    ],
    codeExamples: [
      {
        id: 'pytest-ws',
        title: 'Testing Broadcast Logic',
        files: {
          'tests/test_ws.py': {
            language: 'python',
            code: `from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_websocket_broadcast():
    # Connect two clients simultaneously
    with client.websocket_connect("/ws/room1") as ws1:
        with client.websocket_connect("/ws/room1") as ws2:
            
            # Client 1 sends a message
            ws1.send_json({"msg": "Hello Room"})
            
            # Client 2 should receive it
            data2 = ws2.receive_json()
            assert data2["msg"] == "Hello Room"
            
            # Client 1 should also receive its own broadcast
            data1 = ws1.receive_json()
            assert data1["msg"] == "Hello Room"`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'production-deployment': {
    id: '12-10',
    slug: 'production-deployment',
    chapterId: 12,
    order: 10,
    title: 'Production WebSocket Deployment',
    description: 'Configure Nginx, Uvicorn, and load balancers to correctly route and maintain long-lived WebSocket connections.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.nginx, technologies.fastapi, technologies.websockets],
    prerequisites: ['12-01'],
    objectives: [
      'Configure Nginx for WebSocket proxying',
      'Set appropriate proxy timeout values',
      'Monitor WebSocket connection counts and durations',
      'Handle load balancer WebSocket support'
    ],
    sections: [
      {
        id: 'nginx-proxy',
        type: 'concept',
        title: 'Nginx Configuration for WebSockets',
        content: `By default, Nginx does not proxy the HTTP \`Upgrade\` headers required for WebSockets, resulting in a 400 Bad Request or failed handshake. You must explicitly configure Nginx to pass these headers.

Furthermore, Nginx has a \`proxy_read_timeout\` that defaults to 60 seconds. If a WebSocket connection is idle (no messages) for 60 seconds, Nginx will abruptly close the TCP connection. You must either increase this timeout or ensure your application-level Ping/Pong heartbeats fire more frequently than the Nginx timeout.`
      }
    ],
    codeExamples: [
      {
        id: 'nginx-conf',
        title: 'Nginx WebSocket Block',
        files: {
          'nginx.conf': {
            language: 'nginx',
            code: `map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name api.example.com;

    location /ws/ {
        proxy_pass http://uvicorn_backend;
        
        # Required for WebSockets
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;

        # Keep connection open for 1 hour of idleness (or use heartbeats)
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-cloud-lb',
        severity: 'warning',
        content: 'Managed Load Balancers (AWS ALB, GCP Load Balancer) have their own idle timeouts. If your WebSocket connections randomly drop exactly every 60 or 300 seconds, it is almost certainly a load balancer or proxy timeout killing the idle TCP connection.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  }
};
