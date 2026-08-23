import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch01Lessons: Record<string, Lesson> = {
  'asgi-deep-dive': {
    id: "01-01",
    slug: "asgi-deep-dive",
    chapterId: 1,
    order: 1,
    title: "ASGI Deep Dive: Understanding the Protocol",
    description: "Understand the ASGI specification, how it differs from WSGI, and why it enables true async concurrency in Python web frameworks.",
    duration: 50,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.starlette, technologies.python],
    prerequisites: [],
    objectives: [
      "Master the ASGI 3.0 specification signature: async def app(scope, receive, send)",
      "Deconstruct scope dictionaries, receive event channels, and send message formats",
      "Trace request lifecycle from TCP socket through Uvicorn, ASGI middleware, to response",
      "Implement a raw ASGI server, streaming response, and custom ASGI timing middleware from scratch",
      "Diagnose and debug client disconnects, backpressure stalls, and message ordering bugs"
    ],
    sections: [
      {
        id: "asgi-vs-wsgi",
        type: "concept",
        title: "The Concurrency Wall: WSGI vs ASGI",
        content: `To understand why FastAPI is fast, you must first understand the fundamental architectural barrier that Python web servers hit for over 15 years: **WSGI (Web Server Gateway Interface, PEP 3333)**.

In WSGI, an application is a synchronous callable with the signature:
\`\`\`python
def application(environ: dict, start_response: callable) -> Iterable[bytes]:
\`\`\`

Under WSGI (Gunicorn, uWSGI), every incoming HTTP request locks an entire operating system thread or worker process. While that thread is waiting on PostgreSQL to execute a query or Redis to fetch a session, the thread is completely blocked in kernel space. To serve 1,000 concurrent slow requests (e.g., long-polling, file uploads, slow database queries), a WSGI server requires 1,000 OS threads or processes — consuming gigabytes of RAM and triggering massive context-switching overhead.

**ASGI (Asynchronous Server Gateway Interface)** replaces this synchronous blocking contract with an asynchronous, event-driven message-passing protocol based on \`asyncio\`.

Instead of 1 thread per connection:
- A single Uvicorn worker process running an \`asyncio\` event loop can manage tens of thousands of open TCP connections concurrently.
- When an I/O operation occurs (socket read, database wait), the coroutine yields control back to the event loop (\`await\`), allowing other requests to execute.
- WebSockets, Server-Sent Events (SSE), HTTP/2 multiplexing, and long-lived streaming connections become first-class citizens.`,
        diagram: {
          title: "WSGI Thread-Per-Connection vs ASGI Event-Driven Loop",
          diagram: `+-----------------------------------------------------------------------+
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
+-----------------------------------------------------------------------+`,
          caption: "ASGI multiplexes thousands of active connections across a single worker event loop using async/await non-blocking coroutines."
        }
      },
      {
        id: "asgi-spec-internals",
        type: "architecture",
        title: "The ASGI 3.0 Specification Anatomy",
        content: `The entire ASGI 3.0 specification is defined by a single 3-argument coroutine signature:

\`\`\`python
async def app(scope: dict, receive: callable, send: callable) -> None:
\`\`\`

Let's dissect the exact responsibilities of each argument:

### 1. \`scope\`: The Connection State
The \`scope\` is a persistent Python dictionary containing connection metadata. It exists for the entire lifetime of the connection.
For HTTP requests, \`scope["type"] == "http"\`. For WebSockets, \`scope["type"] == "websocket"\`. For application startup/shutdown, \`scope["type"] == "lifespan"\`.

Crucial HTTP \`scope\` keys:
- \`type\`: \`"http"\`
- \`method\`: \`"GET"\`, \`"POST"\`, etc. (ASCII string)
- \`path\`: URL path, e.g. \`"/api/v1/orders"\`
- \`raw_path\`: Raw unquoted byte path, e.g. \`b"/api/v1/orders"\`
- \`headers\`: List of 2-item byte tuples: \`[(b"host", b"api.example.com"), (b"authorization", b"Bearer ...")]\`
- \`client\`: 2-tuple \`(host_ip, port)\`, e.g. \`("192.168.1.50", 54321)\`
- \`server\`: 2-tuple \`(server_ip, port)\`, e.g. \`("0.0.0.0", 8000)\`
- \`app\`: Reference to the ASGI application instance
- \`state\`: Mutable dictionary shared across middleware and endpoint handlers

### 2. \`receive()\`: Inbound Message Channel
\`receive\` is an \`async\` callable that returns message dictionaries sent from the server (Uvicorn) to the application.
When the client sends the HTTP request body:
\`\`\`python
message = await receive()
# Format for http.request:
# {
#     "type": "http.request",
#     "body": b'{"item_id": 42}',
#     "more_body": False
# }
\`\`\`
If the payload is streamed (e.g. 50MB file upload), \`receive()\` is awaited repeatedly in a loop until \`message.get("more_body", False)\` is \`False\`.
If the client terminates the connection prematurely, \`receive()\` returns \`{"type": "http.disconnect"}\`.

### 3. \`send()\`: Outbound Message Channel
\`send\` is an \`async\` callable used to transmit messages back to Uvicorn and the TCP socket.
HTTP responses require an exact 2-phase message sequence:
1. \`http.response.start\`: Sets the HTTP status code and response headers.
2. \`http.response.body\`: Sends payload chunks. Multiple body messages can be sent with \`more_body=True\` for chunked streaming.`,
        diagram: {
          title: "ASGI Scope, Receive, and Send Message Sequence",
          diagram: `Client           Uvicorn Server                   ASGI App
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
  |                    |                              | Coroutine returns`,
          caption: "Exact message protocol exchange between Uvicorn and an ASGI application."
        }
      },
      {
        id: "raw-asgi-implementation",
        type: "implementation",
        title: "Writing a Production-Grade Raw ASGI Stack",
        content: "To master FastAPI, you must be capable of building a raw ASGI application without any framework. Here is a multi-file project demonstrating raw ASGI routing, request body parsing, streaming responses, and timing middleware.",
        codeExample: {
          id: "raw-asgi-app-files",
          title: "Raw ASGI Multi-File Architecture",
          files: {
            'asgi_app/app.py': {
              language: "python",
              code: `import json
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
    })`
            },
            'asgi_app/middleware.py': {
              language: "python",
              code: `import time
import uuid

class ASGITimingMiddleware:
    """Pure ASGI 3.0 middleware that records execution latency and attaches X-Process-Time."""
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

        await self.app(scope, receive, wrapped_send)`
            },
            'asgi_app/main.py': {
              language: "python",
              code: `from asgi_app.app import raw_asgi_app
from asgi_app.middleware import ASGITimingMiddleware

# Wrap raw ASGI app with pure ASGI middleware
app = ASGITimingMiddleware(raw_asgi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)`
            },
            'tests/test_asgi.py': {
              language: "python",
              code: `import pytest
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
        assert response.json() == payload`
            }
          }
        }
      },
      {
        id: "failure-modes-debugging",
        type: "production",
        title: "ASGI Runtime Pitfalls & Production Failure Modes",
        content: `Working with raw ASGI interfaces introduces three catastrophic failure modes if messages are not handled with defensive precision:

### 1. The Hanging Disconnect (Event Loop Leak)
If a client terminates an upload mid-stream (e.g. user closes browser or network drops), Uvicorn sends \`{"type": "http.disconnect"}\` on the \`receive\` channel.
If your application code does not inspect the message type and continues calling \`message["body"]\`, it will either raise a \`KeyError\` or hang indefinitely waiting for body chunks that will never arrive.
**Defense**: Always check \`if message["type"] == "http.disconnect"\` and raise \`asyncio.CancelledError\` or break immediately.

### 2. The Double-Send Protocol Violation
The ASGI specification requires strict message sequencing:
\`http.response.start\` MUST precede \`http.response.body\`.
Calling \`send({"type": "http.response.start"})\` twice, or calling \`send({"type": "http.response.body"})\` before \`start\`, triggers a fatal protocol exception in Uvicorn (\`RuntimeError: Unexpected message type\`).
**Defense**: In custom middleware, track response state with a boolean flag \`response_started = True\`.

### 3. Header Byte Encoding Failures
In ASGI, all headers in \`scope["headers"]\` and \`http.response.start\` MUST be \`bytes\`, NOT \`str\`:
\`[(b"content-type", b"application/json")]\` is valid.
\`[("content-type", "application/json")]\` will crash Uvicorn with a \`TypeError: header values must be bytes\`.
Header names MUST be lowercase ASCII bytes.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: "chal-01-01",
        title: "Build a Chunked ASGI Streaming & IP Filtering Middleware",
        description: `Implement a pure ASGI 3.0 middleware \`BlockIPMiddleware\` that inspects \`scope['client'][0]\`. If the client IP is in a blacklist, immediately abort and send an HTTP 403 Forbidden ASGI response without invoking the downstream application. For permitted IPs, stream the response in 1024-byte chunks with an added \`X-Stream-Chunked: 1\` header.`,
        hint: "Remember that scope['client'] is a tuple of (host_ip, port). Send http.response.start first with status 403, followed by http.response.body.",
        solution: "Check scope['client'][0] against the blocked_ips set. If blocked, construct and send http.response.start and http.response.body directly, then return early.",
        solutionCode: {
          id: "sol-01-01",
          language: "python",
          title: "IP Blocking & Streaming ASGI Middleware",
          filename: "ip_filter_middleware.py",
          code: `class BlockIPMiddleware:
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

        await self.app(scope, receive, send)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: "iq-asgi-deep-dive-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-asgi-deep-dive-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-asgi-deep-dive-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-asgi-deep-dive-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-asgi-deep-dive-5",
        question: "What security considerations and threat vectors apply to ASGI Deep Dive: Understanding the Protocol in a public API?",
        answer: "Security considerations for **ASGI Deep Dive: Understanding the Protocol**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [
      {
        id: "pn-01-01-1",
        severity: "critical",
        content: "Never invoke synchronous I/O libraries (e.g. requests, psycopg2, time.sleep) inside an async def FastAPI route or ASGI middleware. Always use async equivalents (httpx, asyncpg, asyncio.sleep) or declare the endpoint with regular 'def' to let FastAPI offload it to the threadpool."
      },
      {
        id: "pn-01-01-2",
        severity: "warning",
        content: "Set uvicorn --timeout-graceful-shutdown 30 in containerized deployments to give inflight ASGI coroutines adequate time to commit transactions and release resources before SIGKILL."
      }
    ],
    realWorldScenarios: [
      {
        id: "rws-01-01-1",
        scenario: "Streaming Multi-Gigabyte CSV Exports Without Memory Exhaustion",
        problem: "An analytics dashboard endpoint exporting 5GB CSV reports was buffering the entire payload in RAM before sending, causing Uvicorn worker OOM (Out Of Memory) kills on Kubernetes.",
        solution: "Refactored the endpoint to a custom ASGI streaming response using async generators and chunked transfer encoding (http.response.body with more_body=True). Memory usage plummeted from 5.2GB to a constant 14MB buffer regardless of export size."
      }
    ],
    commonMistakes: [
      {
        id: "cm-01-01-1",
        title: "Passing Strings Instead of Byte Tuples for ASGI Headers",
        description: "The ASGI specification mandates that headers must be a list of 2-item byte tuples. Passing strings results in runtime crashes inside Uvicorn.",
        badCode: {
          id: "bad-asgi-headers",
          language: "python",
          title: "❌ String Headers (Crashes Uvicorn)",
          code: `# BUG: Strings will raise TypeError: header values must be bytes
await send({
    "type": "http.response.start",
    "status": 200,
    "headers": [
        ("Content-Type", "application/json")
    ]
})`
        },
        goodCode: {
          id: "good-asgi-headers",
          language: "python",
          title: "✅ Byte Tuple Headers (Compliant)",
          code: `# CORRECT: Lowercase ASCII bytes
await send({
    "type": "http.response.start",
    "status": 200,
    "headers": [
        (b"content-type", b"application/json"),
        (b"x-api-version", b"2.1.0")
    ]
})`
        }
      }
    ],
    systemDesign: {
      id: "sd-01-01",
      context: "Architecting an API Gateway vs in-process ASGI Middleware for a high-traffic SaaS platform serving 50,000 requests/sec.",
      components: [
        "Edge Load Balancer (Nginx / Envoy)",
        "ASGI Middleware Chain (Correlation IDs, Security Headers)",
        "FastAPI Application Cluster",
        "PostgreSQL & Redis Clusters"
      ],
      challenges: ["Microsecond latency overhead per request", "TLS termination and connection pooling", "Global distributed rate limiting"],
      solutions: ["Offload TLS termination and coarse IP rate limiting to Nginx / Envoy reverse proxy", "Keep in-process ASGI middleware lightweight (request ID propagation, context variables)", "Resolve authentication and fine-grained authorization inside FastAPI dependency graph"],
      options: [
        {
          name: "Heavy ASGI Middleware Processing (Compression, Auth, SSL, Rate Limiting in Python)",
          pros: ["Single technology stack (Pure Python)", "Unified debugging and testing"],
          cons: ["High CPU consumption in Python runtime", "GIL contention for heavy cryptographic operations"]
        },
        {
          name: "Split Architecture: Envoy / Nginx Reverse Proxy + Lean FastAPI ASGI",
          pros: ["Sub-millisecond SSL handshake and gzip in C/C++", "Python CPU cycles reserved strictly for business logic"],
          cons: ["Requires maintaining separate reverse proxy config and deployment manifests"]
        }
      ],
      recommended: "Split Architecture: Envoy / Nginx Reverse Proxy + Lean FastAPI ASGI",
      justification: "Offloading network concerns (TLS termination, gzip compression, connection buffering) to Envoy or Nginx preserves Python event loop throughput for core application domain execution."
    },
    labs: [
      {
        id: "lab-01-01",
        title: "Build and Benchmark Raw ASGI vs FastAPI",
        description: "Construct a minimal raw ASGI application alongside an equivalent FastAPI application. Run a benchmark using hey or wrk with 200 concurrent connections.",
        setupInstructions: "pip install uvicorn httpx pytest pytest-asyncio",
        tasks: [
          "1. Implement raw_asgi_app in asgi_demo.py with a /health endpoint returning JSON.",
          "2. Implement an identical FastAPI app in fastapi_demo.py.",
          "3. Start both on ports 8001 and 8002 with uvicorn --workers 1.",
          "4. Benchmark both using: hey -n 10000 -c 100 http://localhost:8001/health and http://localhost:8002/health.",
          "5. Compare p50, p95 latency and memory footprint."
        ],
        validation: "Raw ASGI will demonstrate ~15-25% lower latency and higher RPS due to zero routing overhead, while FastAPI provides automatic OpenAPI generation, parameter validation, and dependency resolution."
      }
    ],
    productionChecklist: [
      {
        id: "pc-01-01-1",
        category: "Concurrency",
        item: "Ensure all blocking I/O calls use async/await drivers or are executed in run_in_threadpool",
        isRequired: true
      },
      {
        id: "pc-01-01-2",
        category: "Lifespan",
        item: "Register database connection pool shutdown and cache disconnects in async contextmanager lifespan",
        isRequired: true
      },
      {
        id: "pc-01-01-3",
        category: "Headers",
        item: "Verify all ASGI middleware headers are lowercase byte tuples",
        isRequired: true
      },
      {
        id: "pc-01-01-4",
        category: "Graceful Shutdown",
        item: "Configure Uvicorn timeout-graceful-shutdown in deployment Helm charts / systemd units",
        isRequired: true
      }
    ]
  },
  'how-fastapi-wraps-starlette': {
    id: "01-02",
    slug: "how-fastapi-wraps-starlette",
    chapterId: 1,
    order: 2,
    title: "How FastAPI Wraps Starlette",
    description: "Explore how FastAPI extends Starlette, what it adds on top, and when to drop down to Starlette primitives directly.",
    duration: 40,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.starlette],
    prerequisites: ["01-01"],
    objectives: [
      "Understand the inheritance hierarchy: class FastAPI(Starlette)",
      "Examine how FastAPI overrides Starlette's Router with APIRouter and Route compilation",
      "Inspect how Request, Response, BackgroundTasks, and WebSocket objects are passed through",
      "Know when to drop down to Starlette primitives for raw performance or custom protocols"
    ],
    sections: [
      {
        id: "class-hierarchy",
        type: "concept",
        title: "The Class Hierarchy: FastAPI is a Starlette Subclass",
        content: `Many developers mistakenly believe FastAPI is an independent framework that competes with Starlette. In reality:

\`\`\`python
class FastAPI(Starlette):
    def __init__(self, ...):
        super().__init__(...)
        self.router: APIRouter = APIRouter(...)
\`\`\`

FastAPI is a specialized metadata and execution layer built directly on top of Starlette.
- **Starlette provides**: The ASGI routing engine, HTTP Request and Response wrappers, WebSocket protocol handling, BackgroundTasks, session and cookie middleware, exception middleware, and server test client (\`httpx.ASGITransport\`).
- **FastAPI adds**: Dependency injection graph resolution (\`Depends\`), Pydantic v2 request body parsing and schema generation, OpenAPI (Swagger/ReDoc) schema compilation, response serialization with status code validation, and parameter extraction (Query, Path, Header, Cookie).`,
        diagram: {
          title: "FastAPI Layered Architecture over Starlette and ASGI",
          diagram: `+-------------------------------------------------------------+
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
+-------------------------------------------------------------+`,
          caption: "FastAPI inherits all routing, connection management, and middleware capabilities directly from Starlette."
        }
      },
      {
        id: "fastapi-route-compilation",
        type: "architecture",
        title: "How FastAPI Compiles Route Handlers",
        content: `When you decorate a function with \`@app.get('/users/{user_id}')\`, FastAPI does not simply register your raw function with Starlette. It wraps it with \`get_request_handler()\`:

1. **Introspection**: FastAPI inspects the Python type annotations of your function signature using \`inspect.signature\` and Pydantic.
2. **Dependency Graph Assembly**: It creates a directed acyclic graph (DAG) of all \`Depends(...)\` dependencies declared in parameters.
3. **Endpoint Wrapper Generation**: It wraps your endpoint in an async wrapper that:
   - Extracts URL path params, query params, headers, and body from the Starlette \`Request\`.
   - Runs validation via Pydantic models.
   - Executes and resolves the dependency graph.
   - Calls your endpoint function (either \`await endpoint()\` if \`async def\`, or \`await run_in_threadpool(endpoint)\` if synchronous \`def\`).
   - Serializes the returned object according to \`response_model\`.
4. **Starlette Route Registration**: The wrapped handler is converted into a Starlette \`Route\` and registered in \`app.router.routes\`.`,
        codeExample: {
          id: "starlette-primitives-comparison",
          title: "Raw Starlette vs FastAPI Feature Comparison",
          files: {
            'comparison/starlette_app.py': {
              language: "python",
              code: `from starlette.applications import Starlette
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

app = Starlette(routes=routes)`
            },
            'comparison/fastapi_app.py': {
              language: "python",
              code: `from fastapi import FastAPI, Path, Query
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
    return {"id": user_id, "name": "Alice", "details": details}`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: "chal-01-02",
        title: "Drop Down to Starlette StreamingResponse with Backpressure",
        description: `Implement a high-throughput video/binary file streaming endpoint in FastAPI using Starlette's \`StreamingResponse\`. The stream must read 64KB chunks from disk asynchronously and support client HTTP Range requests (\`206 Partial Content\`).`,
        hint: "Use aiofiles to read chunks asynchronously without blocking the event loop.",
        solution: "Create an async generator that yields 64KB chunks from the file handle and wrap it inside StreamingResponse(content=generator, media_type='video/mp4').",
        solutionCode: {
          id: "sol-01-02",
          language: "python",
          title: "Starlette StreamingResponse with Async File Chunks",
          filename: "streaming_endpoint.py",
          code: `from fastapi import FastAPI, HTTPException
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
    )`
        }
      }
    ],
    interviewQuestions: [
      {
        id: "iq-how-fastapi-wraps-starlette-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-how-fastapi-wraps-starlette-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-how-fastapi-wraps-starlette-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-how-fastapi-wraps-starlette-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-how-fastapi-wraps-starlette-5",
        question: "What security considerations and threat vectors apply to How FastAPI Wraps Starlette in a public API?",
        answer: "Security considerations for **How FastAPI Wraps Starlette**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [
      {
        id: "pn-01-02-1",
        severity: "info",
        content: "All Starlette middleware (e.g. CORSMiddleware, GZipMiddleware, TrustedHostMiddleware) are 100% compatible with FastAPI and should be added using app.add_middleware()."
      }
    ],
    realWorldScenarios: [
      {
        id: "rws-01-02-1",
        scenario: "High-Throughput Webhook Ingest Pipeline",
        problem: "A financial payment webhook was processing 15,000 payment event callbacks/sec. Pydantic validation on the entire complex nested schema was consuming 80% of CPU.",
        solution: `Bypassed FastAPI Pydantic parsing on the webhook ingestion route using raw Starlette Request (\`await request.body()\`), queued raw bytes directly to RabbitMQ, and pushed response \`202 Accepted\` in < 2ms.`
      }
    ],
    commonMistakes: [
      {
        id: "cm-01-02-1",
        title: "Using synchronous open() inside StreamingResponse generator",
        description: "Using standard Python open() in a generator passed to StreamingResponse will block the entire asyncio event loop on disk I/O.",
        badCode: {
          id: "bad-sync-stream",
          language: "python",
          title: "❌ Synchronous File Read (Blocks Event Loop)",
          code: `def sync_generator():
    with open('large_file.dat', 'rb') as f:
        while chunk := f.read(65536):
            yield chunk  # Blocks event loop!`
        },
        goodCode: {
          id: "good-async-stream",
          language: "python",
          title: "✅ Asynchronous File Read (Non-Blocking)",
          code: `async def async_generator():
    async with aiofiles.open('large_file.dat', 'rb') as f:
        while chunk := await f.read(65536):
            yield chunk  # Yields control back to event loop`
        }
      }
    ]
  },
  'pydantic-v2-internals': {
    id: "01-03",
    slug: "pydantic-v2-internals",
    chapterId: 1,
    order: 3,
    title: "Pydantic v2 Internals & Validation Engine",
    description: "Production deep dive into Pydantic v2 Internals & Validation Engine",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.pydantic, technologies.python],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Pydantic v2 Internals & Validation Engine",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "pydantic-v2-rust-core",
        type: "concept",
        title: "Pydantic v2 Core: The Rust Engine (pydantic-core)",
        content: `Pydantic v2 is a total architectural rewrite of Python data validation. In Pydantic v1, model parsing was executed via pure Python recursive tree traversal, creating significant CPU overhead for large JSON payloads.

In Pydantic v2, Python code generates a validation schema dictionary at class definition time. This schema is compiled directly into a **Rust-based validator (\`pydantic-core\`)**.

When a request arrives in FastAPI:
1. \`pydantic-core\` parses JSON directly in compiled C/Rust memory without creating intermediate Python \`dict\` or \`str\` objects.
2. Type coercion, regex matching, and constraint checking occur directly in Rust.
3. Only if validation succeeds are Python model instances instantiated.
4. This yields a **5x to 20x throughput improvement** over Pydantic v1.`,
        diagram: {
          title: "Pydantic v2 Compilation and Execution Pipeline",
          diagram: `Python Class Definition
        |
        v
Schema Compilation (Python) ---> Generates JSON Schema & Validator Tree
        |
        v
Rust Core Compilation      ---> pydantic_core.SchemaValidator (C/Rust)
        |
        +======================================================+
        | Runtime Request Execution                           |
        | Raw HTTP Bytes ---> [ pydantic-core in Rust ]        |
        |                       |-> Direct Type Validation     |
        |                       |-> Strict Coercion Checks     |
        |                       v                              |
        |           Valid Python Model Object / ValidationError|
        +======================================================+`,
          caption: "Validation logic is compiled once into Rust at startup, avoiding Python interpreter overhead during requests."
        }
      },
      {
        id: "pydantic-v2-patterns",
        type: "implementation",
        title: "Production Pydantic v2 Models: Field, ConfigDict, and Custom Validators",
        content: "Let's look at a production-grade multi-file Pydantic v2 schema architecture with strict typing, custom field serializers, computed properties, and validation decorators.",
        codeExample: {
          id: "pydantic-v2-code",
          title: "Production Pydantic v2 Architecture",
          files: {
            'schemas/base.py': {
              language: "python",
              code: `from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AppBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
        use_enum_values=True,
        validate_default=True,
        extra="forbid",  # Prevent mass-assignment vulnerabilities
        frozen=False
    )`
            },
            'schemas/user.py': {
              language: "python",
              code: `from pydantic import Field, field_validator, model_validator, computed_field
from typing import Annotated
from schemas.base import AppBaseModel
import re

class UserCreate(AppBaseModel):
    email: Annotated[str, Field(max_length=255, pattern=r"^[^@]+@[^@]+\\.[^@]+$")]
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}" `
            },
            'tests/test_schemas.py': {
              language: "python",
              code: `import pytest
from pydantic import ValidationError
from schemas.user import UserCreate

def test_valid_user_create():
    user = UserCreate(
        email="  Alice@Example.COM  ",
        password="SecurePassword123",
        first_name="Alice",
        last_name="Smith"
    )
    assert user.email == "alice@example.com"
    assert user.full_name == "Alice Smith"

def test_weak_password_raises():
    with pytest.raises(ValidationError) as exc:
        UserCreate(
            email="bob@example.com",
            password="weak",
            first_name="Bob",
            last_name="Jones"
        )
    assert "at least 8 characters" in str(exc.value)`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: "chal-01-03",
        title: "Build a Multi-Format Date and Currency Serializer in Pydantic v2",
        description: `Implement a custom Pydantic v2 model \`TransactionSchema\` that accepts both ISO strings and UNIX epoch timestamps for \`timestamp\`, coercing them into UTC \`datetime\` objects. Add a \`amount_cents\` integer field with a \`@computed_field\` returning formatted currency \`$X.XX\`.`,
        hint: "Use mode='before' in field_validator for timestamp and @computed_field for currency.",
        solution: "Convert integer/float timestamps with datetime.fromtimestamp(v, timezone.utc) inside @field_validator(mode='before').",
        solutionCode: {
          id: "sol-01-03",
          language: "python",
          title: "Custom Serializer Solution",
          filename: "transaction_schema.py",
          code: `from pydantic import BaseModel, field_validator, computed_field
from datetime import datetime, timezone

class TransactionSchema(BaseModel):
    transaction_id: str
    amount_cents: int
    timestamp: datetime

    @field_validator("timestamp", mode="before")
    @classmethod
    def parse_flexible_timestamp(cls, v):
        if isinstance(v, (int, float)):
            return datetime.fromtimestamp(v, tz=timezone.utc)
        return v

    @computed_field
    @property
    def formatted_amount(self) -> str:
        return f"\${self.amount_cents / 100:.2f}" `
        }
      }
    ],
    interviewQuestions: [
      {
        id: "iq-pydantic-v2-internals-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-pydantic-v2-internals-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-pydantic-v2-internals-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-pydantic-v2-internals-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-pydantic-v2-internals-5",
        question: "What security considerations and threat vectors apply to Pydantic v2 Internals & Validation Engine in a public API?",
        answer: "Security considerations for **Pydantic v2 Internals & Validation Engine**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [
      {
        id: "cm-01-03-1",
        title: "Using extra='allow' in public API Request schemas",
        description: "Allowing extra parameters in request models exposes your backend to mass-assignment attacks where clients inject hidden fields like is_admin=True.",
        badCode: {
          id: "bad-extra-allow",
          language: "python",
          title: "❌ extra='allow' (Security Risk)",
          code: `class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="allow") # Vulnerable!
    name: str`
        },
        goodCode: {
          id: "good-extra-forbid",
          language: "python",
          title: "✅ extra='forbid' (Secure)",
          code: `class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid") # Rejects unknown keys
    name: str`
        }
      }
    ],
    labs: [],
    productionChecklist: []
  },
  'dependency-injection-architecture': {
    id: "01-04",
    slug: "dependency-injection-architecture",
    chapterId: 1,
    order: 4,
    title: "Dependency Injection Architecture",
    description: "Production deep dive into Dependency Injection Architecture",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Dependency Injection Architecture",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "di-mechanics",
        type: "concept",
        title: "The Directed Acyclic Graph (DAG) of Dependencies",
        content: `FastAPI's Dependency Injection (\`Depends\`) system is one of its most powerful architectural features. Rather than a simple service locator, FastAPI builds a **Directed Acyclic Graph (DAG)** of all dependencies required by an endpoint at runtime.

### Key Lifecycle Principles:
1. **Hierarchical Resolution**: If Dependency C depends on B, and B depends on A, FastAPI executes \`A -> B -> C\` in topological order.
2. **Per-Request Memoization (\`use_cache=True\`)**: If 5 sub-dependencies across your router all depend on \`get_db()\`, FastAPI resolves \`get_db()\` exactly **once** per HTTP request and caches the result for the duration of that request.
3. **Context Management (\`yield\` dependencies)**: Any dependency defined with \`yield\` acts as an async context manager. Code before \`yield\` runs before the route handler, and code after \`yield\` is guaranteed to execute during teardown (even if an unhandled exception occurs in the endpoint).`,
        diagram: {
          title: "FastAPI Dependency Resolution DAG",
          diagram: `               [ HTTP Request ]
                       |
        +--------------+--------------+
        |                             |
        v                             v
[ get_db_session() ]          [ get_current_user() ]
  (yields Session)                    |
        |                   +---------+---------+
        |                   |                   |
        |                   v                   v
        |           [ get_jwt_token() ]  [ get_user_repo() ]
        |                   |                   |
        +-------------------+-------------------+
                            |
                            v
                [ Endpoint: create_order() ]
                            |
                [ Response to Client ]
                            |
        +-------------------+-------------------+
        | (Teardown phase: code after yield)    |
        v                                       v
[ session.close() ]                     [ cleanup / metrics ]`,
          caption: "FastAPI builds a dependency DAG, executes setup in topological order, passes resolved objects to the route, and runs teardown on response exit."
        }
      },
      {
        id: "di-multi-file",
        type: "implementation",
        title: "Building a Testable, Layered Dependency System",
        content: "Here is how to structure layered production dependencies for authentication, database sessions, and repository injection with full test override support.",
        codeExample: {
          id: "di-code-example",
          title: "Layered Dependency Injection Project",
          files: {
            'app/core/dependencies.py': {
              language: "python",
              code: `from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal

security = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    if token != "secret-master-token":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return "user_uuid_123" `
            },
            'app/api/routes.py': {
              language: "python",
              code: `from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db, get_current_user_id

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("")
async def create_order(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    return {"status": "created", "user_id": user_id}`
            },
            'tests/test_routes.py': {
              language: "python",
              code: `import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from app.api.routes import router
from app.core.dependencies import get_current_user_id

app = FastAPI()
app.include_router(router)

# Override authentication dependency for tests
app.dependency_overrides[get_current_user_id] = lambda: "mock_test_user"

@pytest.mark.asyncio
async def test_create_order_override():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/orders")
        assert response.status_code == 200
        assert response.json()["user_id"] == "mock_test_user" `
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: "chal-01-04",
        title: "Build a Scoped Transaction Rollback Dependency",
        description: `Implement a custom \`get_transactional_db\` dependency using \`AsyncSession\` with nested savepoints. If an inner service raises a custom \`BusinessLogicError\`, roll back only to the savepoint while preserving audit logs written to the outer session.`,
        hint: "Use session.begin_nested() to create an async savepoint context manager.",
        solution: "Wrap inner operations inside async with session.begin_nested(): and catch specific business exceptions.",
        solutionCode: {
          id: "sol-01-04",
          language: "python",
          title: "Nested Transaction Dependency",
          filename: "transactional_di.py",
          code: `from sqlalchemy.ext.asyncio import AsyncSession

async def run_with_savepoint(session: AsyncSession, operation, *args, **kwargs):
    async with session.begin_nested():
        return await operation(session, *args, **kwargs)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: "iq-dependency-injection-architecture-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-dependency-injection-architecture-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-dependency-injection-architecture-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-dependency-injection-architecture-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-dependency-injection-architecture-5",
        question: "What security considerations and threat vectors apply to Dependency Injection Architecture in a public API?",
        answer: "Security considerations for **Dependency Injection Architecture**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'application-lifecycle-lifespan': {
    id: "01-05",
    slug: "application-lifecycle-lifespan",
    chapterId: 1,
    order: 5,
    title: "Application Lifecycle & Lifespan Events",
    description: "Production deep dive into Application Lifecycle & Lifespan Events",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.postgresql, technologies.redis],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Application Lifecycle & Lifespan Events",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "lifespan-context-manager",
        type: "concept",
        title: "Modern Async Lifespans (Replacing Deprecated @app.on_event)",
        content: `In older FastAPI versions, \`@app.on_event("startup")\` and \`@app.on_event("shutdown")\` were used. These are deprecated because they cannot easily share state and have no unified error propagation.

The modern standard is the **Lifespan Async Context Manager**:
\`\`\`python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup phase: Initialize pools, warm caches, start workers
    yield {"db_pool": pool, "redis": redis}
    # Shutdown phase: Drain pools, flush logs, cancel tasks
\`\`\`

### State Storage:
Anything yielded inside the lifespan dictionary or assigned to \`app.state\` is available to every route handler via \`request.state\` or \`request.app.state\`.`,
        codeExample: {
          id: "lifespan-code",
          title: "Production Lifespan Context Manager",
          files: {
            'app/main.py': {
              language: "python",
              code: `from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import asyncio

class RedisPool:
    async def close(self):
        print("Redis pool closed cleanly.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 [STARTUP] Connecting to PostgreSQL and Redis...")
    redis_pool = RedisPool()
    app.state.redis = redis_pool
    yield
    print("🛑 [SHUTDOWN] Draining active requests & closing pools...")
    await redis_pool.close()

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health(request: Request):
    has_redis = hasattr(request.app.state, "redis")
    return {"status": "healthy", "redis_initialized": has_redis}`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-application-lifecycle-lifespan-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-application-lifecycle-lifespan-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-application-lifecycle-lifespan-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-application-lifecycle-lifespan-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-application-lifecycle-lifespan-5",
        question: "What security considerations and threat vectors apply to Application Lifecycle & Lifespan Events in a public API?",
        answer: "Security considerations for **Application Lifecycle & Lifespan Events**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'building-middleware-chains': {
    id: "01-06",
    slug: "building-middleware-chains",
    chapterId: 1,
    order: 6,
    title: "Building Middleware Chains",
    description: "Production deep dive into Building Middleware Chains",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.starlette],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Building Middleware Chains",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "middleware-onion",
        type: "concept",
        title: "The Middleware Onion Architecture",
        content: `Middleware in ASGI is a nested pipeline where each layer wraps the next.

When a request enters:
\`Request -> Middleware 1 -> Middleware 2 -> Middleware 3 -> Router -> Route\`

When a response leaves:
\`Response <- Middleware 1 <- Middleware 2 <- Middleware 3 <- Route\`

### Pure ASGI vs BaseHTTPMiddleware:
- **BaseHTTPMiddleware**: Easy to write (\`async def dispatch(request, call_next)\`), but buffers the response stream in memory, which breaks streaming responses and adds latency overhead.
- **Pure ASGI Middleware**: Implements \`async def __call__(self, scope, receive, send)\`. Zero memory allocation, full streaming support, microsecond execution.`,
        diagram: {
          title: "Pure ASGI Middleware Pipeline",
          diagram: `[ Incoming Request ]
        |
        v
+-------------------------------+
| SecurityHeadersMiddleware     |
|   |                           |
|   v                           |
| +---------------------------+ |
| | RequestIdMiddleware       | |
| |   |                       | |
| |   v                       | |
| | +-----------------------+ | |
| | | TimingMiddleware      | | |
| | |   |                   | | |
| | |   v                   | | |
| | | [ FastAPI Router ]    | | |
| | |   |                   | | |
| | |   v                   | | |
| | | [ Route Handler ]     | | |
| | +-----------------------+ | |
| +---------------------------+ |
+-------------------------------+
        |
        v
[ Outgoing Response ]`,
          caption: "Each ASGI middleware layer intercepts inbound scope/receive and outbound send messages."
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-building-middleware-chains-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-building-middleware-chains-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-building-middleware-chains-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-building-middleware-chains-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-building-middleware-chains-5",
        question: "What security considerations and threat vectors apply to Building Middleware Chains in a public API?",
        answer: "Security considerations for **Building Middleware Chains**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'router-architecture-modular-design': {
    id: "01-07",
    slug: "router-architecture-modular-design",
    chapterId: 1,
    order: 7,
    title: "Router Architecture & Modular Design",
    description: "Production deep dive into Router Architecture & Modular Design",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Router Architecture & Modular Design",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "router-modular",
        type: "concept",
        title: "Modular APIRouter Hierarchy",
        content: `Large-scale FastAPI backends avoid placing routes directly on \`app\`. Instead, routes are organized hierarchically using \`APIRouter\` with dedicated prefixes, tags, dependencies, and response models.

\`\`\`text
src/
├── api/
│   ├── v1/
│   │   ├── api.py (aggregates sub-routers)
│   │   ├── endpoints/
│   │   │   ├── users.py
│   │   │   ├── items.py
│   │   │   └── auth.py
│   └── v2/
\`\`\` `
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-router-architecture-modular-design-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-router-architecture-modular-design-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-router-architecture-modular-design-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-router-architecture-modular-design-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-router-architecture-modular-design-5",
        question: "What security considerations and threat vectors apply to Router Architecture & Modular Design in a public API?",
        answer: "Security considerations for **Router Architecture & Modular Design**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'service-layer-pattern': {
    id: "01-08",
    slug: "service-layer-pattern",
    chapterId: 1,
    order: 8,
    title: "Service Layer Pattern",
    description: "Production deep dive into Service Layer Pattern",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Service Layer Pattern",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "service-layer-concept",
        type: "concept",
        title: "Decoupling HTTP from Business Logic with the Service Layer",
        content: `A critical mistake in backend engineering is writing business logic (credit card charges, discount algorithms, PDF generation) directly inside FastAPI endpoint functions.

The **Service Layer** encapsulates all domain business rules into pure Python service classes. The FastAPI route handler only acts as a thin HTTP controller:
1. Validates HTTP input.
2. Calls \`service.execute(...)\`.
3. Returns HTTP response status.`,
        codeExample: {
          id: "service-layer-code",
          title: "Service Layer Pattern Implementation",
          files: {
            'app/services/payment_service.py': {
              language: "python",
              code: `class PaymentService:
    def __init__(self, db_session, email_gateway):
        self.db = db_session
        self.email_gateway = email_gateway

    async def process_order_payment(self, user_id: str, order_id: str, amount_cents: int) -> dict:
        if amount_cents <= 0:
            raise ValueError("Payment amount must be greater than zero")
        # Execute business logic
        transaction_id = f"tx_{order_id}_success"
        await self.email_gateway.send_receipt(user_id, amount_cents)
        return {"transaction_id": transaction_id, "status": "settled"}`
            },
            'app/api/endpoints.py': {
              language: "python",
              code: `from fastapi import APIRouter, Depends, HTTPException
from app.services.payment_service import PaymentService

router = APIRouter()

@router.post("/orders/{order_id}/pay")
async def pay_order(order_id: str, amount_cents: int):
    service = PaymentService(db_session=None, email_gateway=None)
    try:
        result = await service.process_order_payment("usr_1", order_id, amount_cents)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-service-layer-pattern-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-service-layer-pattern-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-service-layer-pattern-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-service-layer-pattern-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-service-layer-pattern-5",
        question: "What security considerations and threat vectors apply to Service Layer Pattern in a public API?",
        answer: "Security considerations for **Service Layer Pattern**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'repository-pattern': {
    id: "01-09",
    slug: "repository-pattern",
    chapterId: 1,
    order: 9,
    title: "Repository Pattern Implementation",
    description: "Production deep dive into Repository Pattern Implementation",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.fastapi, technologies.sqlalchemy, technologies.postgresql],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Repository Pattern Implementation",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "repo-pattern",
        type: "concept",
        title: "Abstracting Database Access with Repositories",
        content: `The **Repository Pattern** abstracts all database queries (SQLAlchemy, SQL, Redis) behind abstract interfaces (\`typing.Protocol\` or \`abc.ABC\`).

This decouples your business domain from SQLAlchemy or PostgreSQL specifics, making unit tests run in milliseconds without requiring an active database.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-repository-pattern-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-repository-pattern-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-repository-pattern-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-repository-pattern-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-repository-pattern-5",
        question: "What security considerations and threat vectors apply to Repository Pattern Implementation in a public API?",
        answer: "Security considerations for **Repository Pattern Implementation**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'clean-architecture': {
    id: "01-10",
    slug: "clean-architecture",
    chapterId: 1,
    order: 10,
    title: "Clean Architecture in FastAPI",
    description: "Production deep dive into Clean Architecture in FastAPI",
    duration: 45,
    difficulty: "expert",
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Clean Architecture in FastAPI",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "clean-arch",
        type: "concept",
        title: "Clean Architecture in FastAPI",
        content: `Clean Architecture enforces the **Dependency Rule**: Source code dependencies must only point inwards toward high-level domain policies.

1. **Domain Layer (Core)**: Entities, Value Objects, Domain Exceptions (Zero external dependencies).
2. **Use Cases / Application Layer**: Services orchestrating domain rules.
3. **Interface / Adapters Layer**: FastAPI Routers, Controllers, Serializers.
4. **Infrastructure Layer**: PostgreSQL SQLAlchemy models, Redis caches, Stripe API clients.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-clean-architecture-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-clean-architecture-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-clean-architecture-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-clean-architecture-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-clean-architecture-5",
        question: "What security considerations and threat vectors apply to Clean Architecture in FastAPI in a public API?",
        answer: "Security considerations for **Clean Architecture in FastAPI**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'hexagonal-architecture': {
    id: "01-11",
    slug: "hexagonal-architecture",
    chapterId: 1,
    order: 11,
    title: "Hexagonal Architecture & Ports/Adapters",
    description: "Production deep dive into Hexagonal Architecture & Ports/Adapters",
    duration: 45,
    difficulty: "expert",
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Hexagonal Architecture & Ports/Adapters",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "hexagonal-ports",
        type: "concept",
        title: "Hexagonal Architecture (Ports and Adapters)",
        content: `In Hexagonal Architecture:
- **Ports**: Inbound and Outbound interfaces (e.g. \`NotificationPort\`, \`UserRepositoryPort\`).
- **Adapters**: Concrete implementations (e.g. \`SendGridEmailAdapter\`, \`SQLAlchemyUserAdapter\`, \`FastAPIHttpController\`).

You can replace SendGrid with AWS SES or PostgreSQL with SQLite in tests by simply injecting a different adapter into the port.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-hexagonal-architecture-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-hexagonal-architecture-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-hexagonal-architecture-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-hexagonal-architecture-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-hexagonal-architecture-5",
        question: "What security considerations and threat vectors apply to Hexagonal Architecture & Ports/Adapters in a public API?",
        answer: "Security considerations for **Hexagonal Architecture & Ports/Adapters**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
  'configuration-management': {
    id: "01-12",
    slug: "configuration-management",
    chapterId: 1,
    order: 12,
    title: "Configuration Management with Pydantic Settings",
    description: "Production deep dive into Configuration Management with Pydantic Settings",
    duration: 45,
    difficulty: "advanced",
    technologies: [technologies.pydantic, technologies.python],
    prerequisites: [],
    objectives: [
      "Understand internal mechanics and architecture of Configuration Management with Pydantic Settings",
      "Implement production-grade patterns with full type safety and error handling",
      "Diagnose runtime failure modes, edge cases, and performance bottlenecks",
      "Test and validate behavior under concurrent real-world production workloads"
    ],
    sections: [
      {
        id: "pydantic-settings-config",
        type: "concept",
        title: "Typed Configuration with pydantic-settings",
        content: `Managing configuration via raw \`os.environ.get()\` leads to silent runtime crashes when required environment variables are missing or misconfigured.

\`pydantic-settings\` provides strongly-typed, immutable, validated application configuration loaded from environment variables and \`.env\` files with automatic type casting.`,
        codeExample: {
          id: "settings-code",
          title: "Production Settings Configuration",
          files: {
            'app/core/config.py': {
              language: "python",
              code: `from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, RedisDsn, Field
from functools import lru_cache

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    PROJECT_NAME: str = "FastAPI Mastery Platform"
    POSTGRES_URI: PostgresDsn
    REDIS_URI: RedisDsn
    SECRET_KEY: str = Field(min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [
      {
        id: "iq-configuration-management-1",
        question: "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
        answer: `WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable \`async def app(scope, receive, send)\`. It multiplexes thousands of active connections across a single Python \`asyncio\` event loop by yielding control during I/O operations (\`await\`), enabling non-blocking concurrency, streaming, and WebSockets.`,
        difficulty: "advanced"
      },
      {
        id: "iq-configuration-management-2",
        question: "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
        answer: `Because it is declared with \`async def\`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (\`httpx\`, \`asyncio.sleep\`) or declare the endpoint with regular synchronous \`def\`, which instructs FastAPI to run it in Starlette's \`anyio\` worker thread pool.`,
        difficulty: "expert"
      },
      {
        id: "iq-configuration-management-3",
        question: "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
        answer: `FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With \`use_cache=True\` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. \`get_db()\`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using \`yield\` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.`,
        difficulty: "expert"
      },
      {
        id: "iq-configuration-management-4",
        question: "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
        answer: `Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by \`pydantic-core\`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.`,
        difficulty: "advanced"
      },
      {
        id: "iq-configuration-management-5",
        question: "What security considerations and threat vectors apply to Configuration Management with Pydantic Settings in a public API?",
        answer: "Security considerations for **Configuration Management with Pydantic Settings**: 1) Input validation must enforce strict schema constraints and extra='forbid' to prevent parameter injection; 2) Authentication and authorization boundaries must be verified at the router/dependency level before business execution; 3) Rate limiting and request size limits must be enforced at the gateway and application level to mitigate Denial of Service (DoS) attacks.",
        difficulty: "advanced"
      }
    ],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
    labs: [],
    productionChecklist: []
  },
};
