import json
import os
from scratch_gen_batch1 import export_chapter_ts

# Load curriculum summary to get exact lesson meta
with open('/tmp/curriculum_summary.json') as f:
    summary = json.load(f)

meta_by_ch = {c['id']: {l['slug']: l for l in c['lessons']} for c in summary}

# ==========================================
# CHAPTER 1: FastAPI Architecture Beyond the Basics
# ==========================================
ch01 = {}

# 01-01: asgi-deep-dive
ch01['asgi-deep-dive'] = {
    "id": "01-01",
    "slug": "asgi-deep-dive",
    "chapterId": 1,
    "order": 1,
    "title": "ASGI Deep Dive: Understanding the Protocol",
    "description": "Understand the ASGI specification, how it differs from WSGI, and why it enables true async concurrency in Python web frameworks.",
    "duration": 50,
    "difficulty": "advanced",
    "technologies": ["fastapi", "starlette", "python"],
    "prerequisites": [],
    "objectives": [
        "Master the ASGI 3.0 specification signature: async def app(scope, receive, send)",
        "Deconstruct scope dictionaries, receive event channels, and send message formats",
        "Trace request lifecycle from TCP socket through Uvicorn, ASGI middleware, to response",
        "Implement a raw ASGI server, streaming response, and custom ASGI timing middleware from scratch",
        "Diagnose and debug client disconnects, backpressure stalls, and message ordering bugs"
    ],
    "sections": [
        {
            "id": "asgi-vs-wsgi",
            "type": "concept",
            "title": "The Concurrency Wall: WSGI vs ASGI",
            "content": """To understand why FastAPI is fast, you must first understand the fundamental architectural barrier that Python web servers hit for over 15 years: **WSGI (Web Server Gateway Interface, PEP 3333)**.

In WSGI, an application is a synchronous callable with the signature:
```python
def application(environ: dict, start_response: callable) -> Iterable[bytes]:
```

Under WSGI (Gunicorn, uWSGI), every incoming HTTP request locks an entire operating system thread or worker process. While that thread is waiting on PostgreSQL to execute a query or Redis to fetch a session, the thread is completely blocked in kernel space. To serve 1,000 concurrent slow requests (e.g., long-polling, file uploads, slow database queries), a WSGI server requires 1,000 OS threads or processes — consuming gigabytes of RAM and triggering massive context-switching overhead.

**ASGI (Asynchronous Server Gateway Interface)** replaces this synchronous blocking contract with an asynchronous, event-driven message-passing protocol based on `asyncio`.

Instead of 1 thread per connection:
- A single Uvicorn worker process running an `asyncio` event loop can manage tens of thousands of open TCP connections concurrently.
- When an I/O operation occurs (socket read, database wait), the coroutine yields control back to the event loop (`await`), allowing other requests to execute.
- WebSockets, Server-Sent Events (SSE), HTTP/2 multiplexing, and long-lived streaming connections become first-class citizens.""",
            "diagram": {
                "title": "WSGI Thread-Per-Connection vs ASGI Event-Driven Loop",
                "diagram": """+-----------------------------------------------------------------------+
| WSGI Architecture (Synchronous / Blocking)                           |
|                                                                       |
| Client 1 ----> [ OS Thread 1: Read Socket -> DB Wait -> Response ]   |
| Client 2 ----> [ OS Thread 2: Read Socket -> DB Wait -> Response ]   |
| Client 3 ----> [ OS Thread 3: BLOCKED waiting for free thread... ]    |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| ASGI Architecture (Asynchronous / Non-Blocking Event Loop)           |
|                                                                       |
| Client 1 --+                                                          |
| Client 2 ----> [ Single Event Loop ] <---> [ Coroutine 1 (DB I/O) ]  |
| Client 3 --+          |              <---> [ Coroutine 2 (Redis I/O)] |
|                       +------------------> [ Coroutine 3 (Parsing) ]  |
+-----------------------------------------------------------------------+""",
                "caption": "ASGI multiplexes thousands of active connections across a single worker event loop using async/await non-blocking coroutines."
            }
        },
        {
            "id": "asgi-spec-internals",
            "type": "architecture",
            "title": "The ASGI 3.0 Specification Anatomy",
            "content": """The entire ASGI 3.0 specification is defined by a single 3-argument coroutine signature:

```python
async def app(scope: dict, receive: callable, send: callable) -> None:
```

Let's dissect the exact responsibilities of each argument:

### 1. `scope`: The Connection State
The `scope` is a persistent Python dictionary containing connection metadata. It exists for the entire lifetime of the connection.
For HTTP requests, `scope["type"] == "http"`. For WebSockets, `scope["type"] == "websocket"`. For application startup/shutdown, `scope["type"] == "lifespan"`.

Crucial HTTP `scope` keys:
- `type`: `"http"`
- `method`: `"GET"`, `"POST"`, etc. (ASCII string)
- `path`: URL path, e.g. `"/api/v1/orders"`
- `raw_path`: Raw unquoted byte path, e.g. `b"/api/v1/orders"`
- `headers`: List of 2-item byte tuples: `[(b"host", b"api.example.com"), (b"authorization", b"Bearer ...")]`
- `client`: 2-tuple `(host_ip, port)`, e.g. `("192.168.1.50", 54321)`
- `server`: 2-tuple `(server_ip, port)`, e.g. `("0.0.0.0", 8000)`
- `app`: Reference to the ASGI application instance
- `state`: Mutable dictionary shared across middleware and endpoint handlers

### 2. `receive()`: Inbound Message Channel
`receive` is an `async` callable that returns message dictionaries sent from the server (Uvicorn) to the application.
When the client sends the HTTP request body:
```python
message = await receive()
# Format for http.request:
# {
#     "type": "http.request",
#     "body": b'{"item_id": 42}',
#     "more_body": False
# }
```
If the payload is streamed (e.g. 50MB file upload), `receive()` is awaited repeatedly in a loop until `message.get("more_body", False)` is `False`.
If the client terminates the connection prematurely, `receive()` returns `{"type": "http.disconnect"}`.

### 3. `send()`: Outbound Message Channel
`send` is an `async` callable used to transmit messages back to Uvicorn and the TCP socket.
HTTP responses require an exact 2-phase message sequence:
1. `http.response.start`: Sets the HTTP status code and response headers.
2. `http.response.body`: Sends payload chunks. Multiple body messages can be sent with `more_body=True` for chunked streaming.""",
            "diagram": {
                "title": "ASGI Scope, Receive, and Send Message Sequence",
                "diagram": """Client           Uvicorn Server                   ASGI App
  |                    |                              |
  |--- TCP Connect --->|                              |
  |--- HTTP POST ----->|-- Creates scope dictionary ->|
  |                    |-- Calls app(scope,rx,tx) --->|
  |                    |                              |
  |                    |<--- await receive() ---------| (App asks for body)
  |                    |--- {"type":"http.request",---|
  |                    |     "body": b"...",          |
  |                    |     "more_body": False} ---->|
  |                    |                              |
  |                    |                              | [App executes logic]
  |                    |                              |
  |                    |<-- {"type":                  |
  |                    |     "http.response.start",   |
  |                    |     "status": 200,           |
  |                    |     "headers": [...]} -------| (App sends headers)
  |<-- HTTP/1.1 200 ---|                              |
  |                    |<-- {"type":                  |
  |                    |     "http.response.body",    |
  |                    |     "body": b"OK"} ----------| (App sends payload)
  |<-- Payload data ---|                              |
  |                    |                              | Coroutine returns""",
                "caption": "Exact message protocol exchange between Uvicorn and an ASGI application."
            }
        },
        {
            "id": "raw-asgi-implementation",
            "type": "implementation",
            "title": "Writing a Production-Grade Raw ASGI Stack",
            "content": """To master FastAPI, you must be capable of building a raw ASGI application without any framework. Here is a multi-file project demonstrating raw ASGI routing, request body parsing, streaming responses, and timing middleware.""",
            "codeExample": {
                "id": "raw-asgi-app-files",
                "title": "Raw ASGI Multi-File Architecture",
                "files": {
                    "asgi_app/app.py": {
                        "language": "python",
                        "code": """import json
import time

async def read_body(receive) -> bytes:
    body = bytearray()
    while True:
        message = await receive()
        if message["type"] == "http.disconnect":
            raise ConnectionResetError("Client disconnected during body upload")
        body.extend(message.get("body", b""))
        if not message.get("more_body", False):
            break
    return bytes(body)

async def raw_asgi_app(scope, receive, send):
    if scope["type"] == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                print("[LIFESPAN] Initializing connection pools...")
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                print("[LIFESPAN] Closing connection pools...")
                await send({"type": "lifespan.shutdown.complete"})
                return

    if scope["type"] != "http":
        return

    path = scope["path"]
    method = scope["method"]

    if path == "/health" and method == "GET":
        payload = json.dumps({"status": "healthy", "timestamp": time.time()}).encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(payload)).encode("ascii")),
            ]
        })
        await send({
            "type": "http.response.body",
            "body": payload,
            "more_body": False
        })
        return

    if path == "/echo" and method == "POST":
        body_bytes = await read_body(receive)
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body_bytes)).encode("ascii")),
            ]
        })
        await send({
            "type": "http.response.body",
            "body": body_bytes,
            "more_body": False
        })
        return

    # 404 Not Found
    not_found = b'{"detail": "Route not found"}'
    await send({
        "type": "http.response.start",
        "status": 404,
        "headers": [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(not_found)).encode("ascii")),
        ]
    })
    await send({
        "type": "http.response.body",
        "body": not_found,
        "more_body": False
    })"""
                    },
                    "asgi_app/middleware.py": {
                        "language": "python",
                        "code": """import time
import uuid

class ASGITimingMiddleware:
    \"\"\"Pure ASGI 3.0 middleware that records execution latency and attaches X-Process-Time.\"\"\"
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.perf_counter()
        request_id = str(uuid.uuid4())
        scope["state"] = scope.get("state", {})
        scope["state"]["request_id"] = request_id

        async def wrapped_send(message):
            if message["type"] == "http.response.start":
                duration_ms = (time.perf_counter() - start_time) * 1000
                headers = list(message.get("headers", []))
                headers.append((b"x-process-time-ms", f"{duration_ms:.2f}".encode("ascii")))
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, wrapped_send)"""
                    },
                    "asgi_app/main.py": {
                        "language": "python",
                        "code": """from asgi_app.app import raw_asgi_app
from asgi_app.middleware import ASGITimingMiddleware

# Wrap raw ASGI app with pure ASGI middleware
app = ASGITimingMiddleware(raw_asgi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)"""
                    },
                    "tests/test_asgi.py": {
                        "language": "python",
                        "code": """import pytest
import httpx
from asgi_app.main import app

@pytest.mark.asyncio
async def test_raw_asgi_health():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "x-process-time-ms" in response.headers
        assert "x-request-id" in response.headers

@pytest.mark.asyncio
async def test_raw_asgi_echo():
    payload = {"message": "Mastering ASGI"}
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/echo", json=payload)
        assert response.status_code == 200
        assert response.json() == payload"""
                    }
                }
            }
        },
        {
            "id": "failure-modes-debugging",
            "type": "production",
            "title": "ASGI Runtime Pitfalls & Production Failure Modes",
            "content": """Working with raw ASGI interfaces introduces three catastrophic failure modes if messages are not handled with defensive precision:

### 1. The Hanging Disconnect (Event Loop Leak)
If a client terminates an upload mid-stream (e.g. user closes browser or network drops), Uvicorn sends `{"type": "http.disconnect"}` on the `receive` channel.
If your application code does not inspect the message type and continues calling `message["body"]`, it will either raise a `KeyError` or hang indefinitely waiting for body chunks that will never arrive.
**Defense**: Always check `if message["type"] == "http.disconnect"` and raise `asyncio.CancelledError` or break immediately.

### 2. The Double-Send Protocol Violation
The ASGI specification requires strict message sequencing:
`http.response.start` MUST precede `http.response.body`.
Calling `send({"type": "http.response.start"})` twice, or calling `send({"type": "http.response.body"})` before `start`, triggers a fatal protocol exception in Uvicorn (`RuntimeError: Unexpected message type`).
**Defense**: In custom middleware, track response state with a boolean flag `response_started = True`.

### 3. Header Byte Encoding Failures
In ASGI, all headers in `scope["headers"]` and `http.response.start` MUST be `bytes`, NOT `str`:
`[(b"content-type", b"application/json")]` is valid.
`[("content-type", "application/json")]` will crash Uvicorn with a `TypeError: header values must be bytes`.
Header names MUST be lowercase ASCII bytes."""
        }
    ],
    "codeExamples": [],
    "challenges": [
        {
            "id": "chal-01-01",
            "title": "Build a Chunked ASGI Streaming & IP Filtering Middleware",
            "description": "Implement a pure ASGI 3.0 middleware `BlockIPMiddleware` that inspects `scope['client'][0]`. If the client IP is in a blacklist, immediately abort and send an HTTP 403 Forbidden ASGI response without invoking the downstream application. For permitted IPs, stream the response in 1024-byte chunks with an added `X-Stream-Chunked: 1` header.",
            "hint": "Remember that scope['client'] is a tuple of (host_ip, port). Send http.response.start first with status 403, followed by http.response.body.",
            "solution": "Check scope['client'][0] against the blocked_ips set. If blocked, construct and send http.response.start and http.response.body directly, then return early.",
            "solutionCode": {
                "id": "sol-01-01",
                "language": "python",
                "title": "IP Blocking & Streaming ASGI Middleware",
                "filename": "ip_filter_middleware.py",
                "code": """class BlockIPMiddleware:
    def __init__(self, app, blocked_ips: set[str]):
        self.app = app
        self.blocked_ips = blocked_ips

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            client_ip = scope.get("client", ("0.0.0.0", 0))[0]
            if client_ip in self.blocked_ips:
                forbidden_msg = b'{"error": "Forbidden: IP blocked by ASGI firewall"}'
                await send({
                    "type": "http.response.start",
                    "status": 403,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(forbidden_msg)).encode("ascii")),
                    ]
                })
                await send({
                    "type": "http.response.body",
                    "body": forbidden_msg,
                    "more_body": False
                })
                return

        await self.app(scope, receive, send)"""
            }
        }
    ],
    "interviewQuestions": [
        {
            "id": "iq-01-01-1",
            "question": "Your FastAPI service has 4 Uvicorn workers and runs on an 8-core CPU. A junior engineer adds a synchronous time.sleep(5) inside an async def endpoint. What happens to throughput under 100 concurrent requests?",
            "answer": "Because the endpoint is declared with async def, FastAPI executes it directly on the main event loop of whichever Uvicorn worker received the request. The synchronous time.sleep(5) blocks that worker's entire event loop thread for 5 seconds, freezing all concurrent requests assigned to that worker. With 4 workers, if 4 concurrent requests hit this endpoint, the entire server becomes completely unresponsive until the sleeps finish. If the function had been declared as def (synchronous), FastAPI would have offloaded it to Starlette's anyio worker thread pool (default 40 threads), allowing the event loop to continue serving traffic.",
            "difficulty": "expert"
        },
        {
            "id": "iq-01-01-2",
            "question": "What is the purpose of the lifespan protocol in ASGI, and how does it prevent resource leaks in production?",
            "answer": "The ASGI lifespan protocol (scope['type'] == 'lifespan') coordinates application startup and graceful shutdown before Uvicorn starts or stops accepting socket connections. On startup ('lifespan.startup'), the app initializes connection pools (PostgreSQL asyncpg, Redis) and background consumers. On shutdown ('lifespan.shutdown'), Uvicorn stops accepting new TCP connections, waits for inflight requests to complete (up to timeout_graceful_shutdown), and then signals the app to close pools, flush logs, and release distributed locks. This guarantees zero connection drops or corrupted transactions during deployments.",
            "difficulty": "expert"
        }
    ],
    "productionNotes": [
        {
            "id": "pn-01-01-1",
            "severity": "critical",
            "content": "Never invoke synchronous I/O libraries (e.g. requests, psycopg2, time.sleep) inside an async def FastAPI route or ASGI middleware. Always use async equivalents (httpx, asyncpg, asyncio.sleep) or declare the endpoint with regular 'def' to let FastAPI offload it to the threadpool."
        },
        {
            "id": "pn-01-01-2",
            "severity": "warning",
            "content": "Set uvicorn --timeout-graceful-shutdown 30 in containerized deployments to give inflight ASGI coroutines adequate time to commit transactions and release resources before SIGKILL."
        }
    ],
    "realWorldScenarios": [
        {
            "id": "rws-01-01-1",
            "scenario": "Streaming Multi-Gigabyte CSV Exports Without Memory Exhaustion",
            "problem": "An analytics dashboard endpoint exporting 5GB CSV reports was buffering the entire payload in RAM before sending, causing Uvicorn worker OOM (Out Of Memory) kills on Kubernetes.",
            "solution": "Refactored the endpoint to a custom ASGI streaming response using async generators and chunked transfer encoding (http.response.body with more_body=True). Memory usage plummeted from 5.2GB to a constant 14MB buffer regardless of export size."
        }
    ],
    "commonMistakes": [
        {
            "id": "cm-01-01-1",
            "title": "Passing Strings Instead of Byte Tuples for ASGI Headers",
            "description": "The ASGI specification mandates that headers must be a list of 2-item byte tuples. Passing strings results in runtime crashes inside Uvicorn.",
            "badCode": {
                "id": "bad-asgi-headers",
                "language": "python",
                "title": "❌ String Headers (Crashes Uvicorn)",
                "code": """# BUG: Strings will raise TypeError: header values must be bytes
await send({
    "type": "http.response.start",
    "status": 200,
    "headers": [
        ("Content-Type", "application/json")
    ]
})"""
            },
            "goodCode": {
                "id": "good-asgi-headers",
                "language": "python",
                "title": "✅ Byte Tuple Headers (Compliant)",
                "code": """# CORRECT: Lowercase ASCII bytes
await send({
    "type": "http.response.start",
    "status": 200,
    "headers": [
        (b"content-type", b"application/json"),
        (b"x-api-version", b"2.1.0")
    ]
})"""
            }
        }
    ],
    "systemDesign": {
        "id": "sd-01-01",
        "context": "Architecting an API Gateway vs in-process ASGI Middleware for a high-traffic SaaS platform serving 50,000 requests/sec.",
        "components": [
            "Edge Load Balancer (Nginx / Envoy)",
            "ASGI Middleware Chain (Correlation IDs, Security Headers)",
            "FastAPI Application Cluster",
            "PostgreSQL & Redis Clusters"
        ],
        "challenges": [
            "Microsecond latency overhead per request",
            "TLS termination and connection pooling",
            "Global distributed rate limiting"
        ],
        "solutions": [
            "Offload TLS termination and coarse IP rate limiting to Nginx / Envoy reverse proxy",
            "Keep in-process ASGI middleware lightweight (request ID propagation, context variables)",
            "Resolve authentication and fine-grained authorization inside FastAPI dependency graph"
        ],
        "options": [
            {
                "name": "Heavy ASGI Middleware Processing (Compression, Auth, SSL, Rate Limiting in Python)",
                "pros": ["Single technology stack (Pure Python)", "Unified debugging and testing"],
                "cons": ["High CPU consumption in Python runtime", "GIL contention for heavy cryptographic operations"]
            },
            {
                "name": "Split Architecture: Envoy / Nginx Reverse Proxy + Lean FastAPI ASGI",
                "pros": ["Sub-millisecond SSL handshake and gzip in C/C++", "Python CPU cycles reserved strictly for business logic"],
                "cons": ["Requires maintaining separate reverse proxy config and deployment manifests"]
            }
        ],
        "recommended": "Split Architecture: Envoy / Nginx Reverse Proxy + Lean FastAPI ASGI",
        "justification": "Offloading network concerns (TLS termination, gzip compression, connection buffering) to Envoy or Nginx preserves Python event loop throughput for core application domain execution."
    },
    "labs": [
        {
            "id": "lab-01-01",
            "title": "Build and Benchmark Raw ASGI vs FastAPI",
            "description": "Construct a minimal raw ASGI application alongside an equivalent FastAPI application. Run a benchmark using hey or wrk with 200 concurrent connections.",
            "setupInstructions": "pip install uvicorn httpx pytest pytest-asyncio",
            "tasks": [
                "1. Implement raw_asgi_app in asgi_demo.py with a /health endpoint returning JSON.",
                "2. Implement an identical FastAPI app in fastapi_demo.py.",
                "3. Start both on ports 8001 and 8002 with uvicorn --workers 1.",
                "4. Benchmark both using: hey -n 10000 -c 100 http://localhost:8001/health and http://localhost:8002/health.",
                "5. Compare p50, p95 latency and memory footprint."
            ],
            "validation": "Raw ASGI will demonstrate ~15-25% lower latency and higher RPS due to zero routing overhead, while FastAPI provides automatic OpenAPI generation, parameter validation, and dependency resolution."
        }
    ],
    "productionChecklist": [
        {"id": "pc-01-01-1", "category": "Concurrency", "item": "Ensure all blocking I/O calls use async/await drivers or are executed in run_in_threadpool", "isRequired": True},
        {"id": "pc-01-01-2", "category": "Lifespan", "item": "Register database connection pool shutdown and cache disconnects in async contextmanager lifespan", "isRequired": True},
        {"id": "pc-01-01-3", "category": "Headers", "item": "Verify all ASGI middleware headers are lowercase byte tuples", "isRequired": True},
        {"id": "pc-01-01-4", "category": "Graceful Shutdown", "item": "Configure Uvicorn timeout-graceful-shutdown in deployment Helm charts / systemd units", "isRequired": True}
    ]
}

# 01-02: how-fastapi-wraps-starlette
ch01['how-fastapi-wraps-starlette'] = {
    "id": "01-02",
    "slug": "how-fastapi-wraps-starlette",
    "chapterId": 1,
    "order": 2,
    "title": "How FastAPI Wraps Starlette",
    "description": "Explore how FastAPI extends Starlette, what it adds on top, and when to drop down to Starlette primitives directly.",
    "duration": 40,
    "difficulty": "advanced",
    "technologies": ["fastapi", "starlette"],
    "prerequisites": ["01-01"],
    "objectives": [
        "Understand the inheritance hierarchy: class FastAPI(Starlette)",
        "Examine how FastAPI overrides Starlette's Router with APIRouter and Route compilation",
        "Inspect how Request, Response, BackgroundTasks, and WebSocket objects are passed through",
        "Know when to drop down to Starlette primitives for raw performance or custom protocols"
    ],
    "sections": [
        {
            "id": "class-hierarchy",
            "type": "concept",
            "title": "The Class Hierarchy: FastAPI is a Starlette Subclass",
            "content": """Many developers mistakenly believe FastAPI is an independent framework that competes with Starlette. In reality:

```python
class FastAPI(Starlette):
    def __init__(self, ...):
        super().__init__(...)
        self.router: APIRouter = APIRouter(...)
```

FastAPI is a specialized metadata and execution layer built directly on top of Starlette.
- **Starlette provides**: The ASGI routing engine, HTTP Request and Response wrappers, WebSocket protocol handling, BackgroundTasks, session and cookie middleware, exception middleware, and server test client (`httpx.ASGITransport`).
- **FastAPI adds**: Dependency injection graph resolution (`Depends`), Pydantic v2 request body parsing and schema generation, OpenAPI (Swagger/ReDoc) schema compilation, response serialization with status code validation, and parameter extraction (Query, Path, Header, Cookie).""",
            "diagram": {
                "title": "FastAPI Layered Architecture over Starlette and ASGI",
                "diagram": """+-------------------------------------------------------------+
| FastAPI Layer                                               |
|  - Dependency Injection (Depends)                           |
|  - Pydantic v2 Serialization & Schema Generation            |
|  - OpenAPI 3.1 & JSON Schema Generator                      |
|  - Parameter Extraction (Query, Path, Header, Security)     |
+-------------------------------------------------------------+
                            | (inherits & extends)
+-------------------------------------------------------------+
| Starlette Layer                                             |
|  - Routing Table & Regex Matcher                            |
|  - Request & Response abstractions (Request, JSONResponse)  |
|  - Middleware Stack (CORSMiddleware, SessionMiddleware)     |
|  - WebSocket Session State Machine                          |
|  - BackgroundTasks Execution                                |
+-------------------------------------------------------------+
                            | (implements)
+-------------------------------------------------------------+
| ASGI 3.0 Specification: async def app(scope, receive, send) |
+-------------------------------------------------------------+""",
                "caption": "FastAPI inherits all routing, connection management, and middleware capabilities directly from Starlette."
            }
        },
        {
            "id": "fastapi-route-compilation",
            "type": "architecture",
            "title": "How FastAPI Compiles Route Handlers",
            "content": """When you decorate a function with `@app.get('/users/{user_id}')`, FastAPI does not simply register your raw function with Starlette. It wraps it with `get_request_handler()`:

1. **Introspection**: FastAPI inspects the Python type annotations of your function signature using `inspect.signature` and Pydantic.
2. **Dependency Graph Assembly**: It creates a directed acyclic graph (DAG) of all `Depends(...)` dependencies declared in parameters.
3. **Endpoint Wrapper Generation**: It wraps your endpoint in an async wrapper that:
   - Extracts URL path params, query params, headers, and body from the Starlette `Request`.
   - Runs validation via Pydantic models.
   - Executes and resolves the dependency graph.
   - Calls your endpoint function (either `await endpoint()` if `async def`, or `await run_in_threadpool(endpoint)` if synchronous `def`).
   - Serializes the returned object according to `response_model`.
4. **Starlette Route Registration**: The wrapped handler is converted into a Starlette `Route` and registered in `app.router.routes`.""",
            "codeExample": {
                "id": "starlette-primitives-comparison",
                "title": "Raw Starlette vs FastAPI Feature Comparison",
                "files": {
                    "comparison/starlette_app.py": {
                        "language": "python",
                        "code": """from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
import json

async def get_user(request):
    # Manual path param extraction
    user_id = request.path_params["user_id"]
    # Manual query param extraction & validation
    include_details = request.query_params.get("details", "false").lower() == "true"
    
    # Manual database fetch
    user_data = {"id": int(user_id), "name": "Alice", "details": include_details}
    
    # Manual JSON serialization
    return JSONResponse(user_data, status_code=200)

routes = [
    Route("/users/{user_id:int}", get_user, methods=["GET"])
]

app = Starlette(routes=routes)"""
                    },
                    "comparison/fastapi_app.py": {
                        "language": "python",
                        "code": """from fastapi import FastAPI, Path, Query
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    name: str
    details: bool

app = FastAPI(title="Production User API")

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int = Path(..., ge=1, description="Database user ID"),
    details: bool = Query(default=False, description="Include metadata")
):
    # Automatic validation, OpenAPI schema generation, and serialization
    return {"id": user_id, "name": "Alice", "details": details}"""
                    }
                }
            }
        }
    ],
    "codeExamples": [],
    "challenges": [
        {
            "id": "chal-01-02",
            "title": "Drop Down to Starlette StreamingResponse with Backpressure",
            "description": "Implement a high-throughput video/binary file streaming endpoint in FastAPI using Starlette's `StreamingResponse`. The stream must read 64KB chunks from disk asynchronously and support client HTTP Range requests (`206 Partial Content`).",
            "hint": "Use aiofiles to read chunks asynchronously without blocking the event loop.",
            "solution": "Create an async generator that yields 64KB chunks from the file handle and wrap it inside StreamingResponse(content=generator, media_type='video/mp4').",
            "solutionCode": {
                "id": "sol-01-02",
                "language": "python",
                "title": "Starlette StreamingResponse with Async File Chunks",
                "filename": "streaming_endpoint.py",
                "code": """from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse
import os
import aiofiles

app = FastAPI()

async def file_chunk_generator(file_path: str, chunk_size: int = 65536):
    async with aiofiles.open(file_path, mode="rb") as f:
        while True:
            chunk = await f.read(chunk_size)
            if not chunk:
                break
            yield chunk

@app.get("/videos/{video_id}/stream")
async def stream_video(video_id: str):
    file_path = f"/var/media/{video_id}.mp4"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    file_size = os.path.getsize(file_path)
    return StreamingResponse(
        file_chunk_generator(file_path),
        media_type="video/mp4",
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes"
        }
    )"""
            }
        }
    ],
    "interviewQuestions": [
        {
            "id": "iq-01-02-1",
            "question": "When would you intentionally drop down to pure Starlette endpoints instead of using FastAPI standard route handlers?",
            "answer": "You drop down to pure Starlette when: 1) Serving extreme high-frequency, low-latency webhook endpoints (e.g. 50,000 RPS ingest) where Pydantic serialization overhead (even a few milliseconds) is unacceptable; 2) Handling complex raw binary protocol streaming or custom WebSockets where FastAPI parameter injection adds unnecessary layers; 3) Writing raw ASGI middleware or custom ASGI lifespans that execute before the FastAPI routing table is matched.",
            "difficulty": "advanced"
        }
    ],
    "productionNotes": [
        {
            "id": "pn-01-02-1",
            "severity": "info",
            "content": "All Starlette middleware (e.g. CORSMiddleware, GZipMiddleware, TrustedHostMiddleware) are 100% compatible with FastAPI and should be added using app.add_middleware()."
        }
    ],
    "realWorldScenarios": [
        {
            "id": "rws-01-02-1",
            "scenario": "High-Throughput Webhook Ingest Pipeline",
            "problem": "A financial payment webhook was processing 15,000 payment event callbacks/sec. Pydantic validation on the entire complex nested schema was consuming 80% of CPU.",
            "solution": "Bypassed FastAPI Pydantic parsing on the webhook ingestion route using raw Starlette Request (`await request.body()`), queued raw bytes directly to RabbitMQ, and pushed response `202 Accepted` in < 2ms.",
        }
    ],
    "commonMistakes": [
        {
            "id": "cm-01-02-1",
            "title": "Using synchronous open() inside StreamingResponse generator",
            "description": "Using standard Python open() in a generator passed to StreamingResponse will block the entire asyncio event loop on disk I/O.",
            "badCode": {
                "id": "bad-sync-stream",
                "language": "python",
                "title": "❌ Synchronous File Read (Blocks Event Loop)",
                "code": """def sync_generator():
    with open('large_file.dat', 'rb') as f:
        while chunk := f.read(65536):
            yield chunk  # Blocks event loop!"""
            },
            "goodCode": {
                "id": "good-async-stream",
                "language": "python",
                "title": "✅ Asynchronous File Read (Non-Blocking)",
                "code": """async def async_generator():
    async with aiofiles.open('large_file.dat', 'rb') as f:
        while chunk := await f.read(65536):
            yield chunk  # Yields control back to event loop"""
            }
        }
    ]
}

print("Chapter 1: 2 lessons compiled.")
