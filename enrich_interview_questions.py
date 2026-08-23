import json
import os
import re
from scratch_gen_batch1 import export_chapter_ts

# Specialized Interview Questions Repository by Chapter Topic
INTERVIEW_BANK = {
    1: [
        {
            "question": "What is the difference between ASGI and WSGI concurrency models, and why does ASGI enable true async I/O?",
            "answer": "WSGI (PEP 3333) uses a synchronous, blocking request-response contract where each connection occupies a dedicated OS worker thread or process. When waiting on database I/O, the entire thread is blocked in kernel space. ASGI (Asynchronous Server Gateway Interface) is an event-driven protocol with a 3-argument callable `async def app(scope, receive, send)`. It multiplexes thousands of active connections across a single Python `asyncio` event loop by yielding control during I/O operations (`await`), enabling non-blocking concurrency, streaming, and WebSockets.",
            "difficulty": "advanced"
        },
        {
            "question": "If an endpoint is declared as 'async def' but contains a synchronous I/O call like 'time.sleep()' or 'requests.get()', what happens in production?",
            "answer": "Because it is declared with `async def`, FastAPI executes it directly on the worker's main event loop thread without offloading. The blocking call freezes the entire event loop for that duration, preventing any other concurrent coroutines on that worker process from executing. If 4 concurrent requests hit a 5-second blocking call across 4 Uvicorn workers, all 4 workers become completely unresponsive. To prevent this, either use async non-blocking drivers (`httpx`, `asyncio.sleep`) or declare the endpoint with regular synchronous `def`, which instructs FastAPI to run it in Starlette's `anyio` worker thread pool.",
            "difficulty": "expert"
        },
        {
            "question": "How does FastAPI resolve dependency injection graphs with 'Depends(..., use_cache=True)' during a request lifecycle?",
            "answer": "FastAPI constructs a Directed Acyclic Graph (DAG) of all declared dependencies. It traverses the DAG in topological order, resolving root dependencies first. With `use_cache=True` (the default), if multiple sub-dependencies or routes require the same dependency (e.g. `get_db()`), FastAPI resolves it exactly once per HTTP request and caches the result for the entire request lifecycle. Dependencies using `yield` execute their setup phase before the route handler and their cleanup/teardown phase in reverse topological order after the response is sent.",
            "difficulty": "expert"
        },
        {
            "question": "What is the performance advantage of Pydantic v2's Rust-backed 'pydantic-core' over Pydantic v1?",
            "answer": "Pydantic v2 compiles Python class definitions into an internal validation schema tree at startup, which is executed directly in compiled C/Rust memory by `pydantic-core`. It validates and parses raw JSON bytes directly in Rust without creating intermediate Python strings or dictionary objects. This eliminates Python interpreter bytecode overhead and object allocation churn, delivering a 5x to 20x throughput improvement.",
            "difficulty": "advanced"
        }
    ],
    2: [
        {
            "question": "How do you structure a large enterprise FastAPI codebase to prevent circular dependencies and high cognitive load?",
            "answer": "Use a feature-based / domain-driven modular structure where features (e.g., `users`, `orders`, `payments`) contain their own routers, schemas, services, and repository adapters. Maintain strict downward dependency flow: Routers -> Services -> Repositories -> Models. Use `typing.TYPE_CHECKING` guards for forward references, avoid importing route modules inside service layers, and inject dependencies using FastAPI's `Depends` system.",
            "difficulty": "advanced"
        },
        {
            "question": "Why should you use RFC 7807 Problem Details for HTTP API error responses instead of custom ad-hoc error formats?",
            "answer": "RFC 7807 defines a standardized JSON format for HTTP error responses (`type`, `title`, `status`, `detail`, `instance`, `invalid_params`). Using a standardized error schema allows API client SDKs, frontend interceptors, and automated observability platforms to consistently parse error metadata, validation errors, and retry-after hints across all services without custom parsing rules.",
            "difficulty": "advanced"
        },
        {
            "question": "How do you configure strict MyPy type checking for FastAPI applications without false positives on SQLAlchemy models?",
            "answer": "Use SQLAlchemy 2.0's `Mapped[T]` and `mapped_column()` declarative typing, and enable the `pydantic.mypy` and `sqlalchemy.ext.mypy.plugin` plugins in `pyproject.toml` or `mypy.ini`. Set `disallow_untyped_defs = true`, `disallow_any_generics = true`, and `warn_unused_ignores = true`. This catches subtle runtime type errors (such as returning None from non-nullable endpoints) at build/CI time.",
            "difficulty": "expert"
        }
    ],
    3: [
        {
            "question": "What causes the N+1 query problem in async SQLAlchemy, and how do you eliminate it using 'selectinload' vs 'joinedload'?",
            "answer": "The N+1 query problem occurs when querying a parent table (1 query) and then iterating over child relationship attributes in a loop (N additional queries). In async SQLAlchemy, implicit lazy loading raises a `DetachedInstanceError` because Python property access cannot be awaited. To fix it eagerly: 1) `selectinload`: Issues a single `SELECT parent` followed by one `SELECT child WHERE parent_id IN (...)` (ideal for 1-to-many collections); 2) `joinedload`: Emits an SQL `LEFT OUTER JOIN` (ideal for many-to-one or one-to-one relationships).",
            "difficulty": "expert"
        },
        {
            "question": "Why is pgBouncer in transaction pooling mode incompatible with PostgreSQL prepared statements, and how do you configure asyncpg to work with it?",
            "answer": "In transaction pooling mode, pgBouncer assigns a server connection to a client only for the duration of a transaction, then reassigns the connection to another client. Server-side prepared statements are connection-specific. If Client B uses a connection where Client A created a prepared statement with the same name, or if Client A tries to execute a prepared statement on a different connection, a PostgreSQL error occurs. In `asyncpg`, you must set `statement_cache_size=0` and `prepared_statement_cache_size=0` when connecting to pgBouncer in transaction mode.",
            "difficulty": "expert"
        },
        {
            "question": "How do you execute zero-downtime database migrations when renaming or dropping columns using Alembic in production?",
            "answer": "Use the **Expand and Contract (Parallel Change) pattern** across multiple deployments: 1) Phase 1 (Expand): Add the new column as nullable in Alembic migration; deploy backend code that writes to BOTH old and new columns and reads from old; 2) Phase 2 (Backfill): Run a background worker/script to copy existing data from old to new column; 3) Phase 3 (Switch): Deploy code that reads and writes exclusively to the new column; 4) Phase 4 (Contract): Run migration to drop the old column.",
            "difficulty": "expert"
        }
    ],
    4: [
        {
            "question": "What is the difference between Optimistic Locking and Pessimistic Locking ('SELECT FOR UPDATE'), and when should you choose each in FastAPI?",
            "answer": "Pessimistic locking (`SELECT FOR UPDATE`) acquires an exclusive row lock at the database level, forcing concurrent transactions to block until the lock holder commits or rolls back. It is ideal for high-contention, low-latency critical resources (e.g. ticket booking, bank balance withdrawals). Optimistic locking adds a `version_id` column and uses compare-and-swap (`UPDATE ... WHERE id = :id AND version_id = :v`). If another transaction modified the row, the row count is 0 and the application catches a conflict to retry. It is ideal for low-contention scenarios (e.g. user profile updates) where database lock contention would degrade throughput.",
            "difficulty": "expert"
        },
        {
            "question": "How do you guarantee idempotency in payment endpoints when client requests time out or retry multiple times?",
            "answer": "Require the client to send a unique `Idempotency-Key` header (UUID). Store the key in an `idempotency_keys` table with columns `(key, user_id, status, response_code, response_body, created_at)` with a `UNIQUE(key, user_id)` constraint. When a request arrives inside a transaction: 1) Insert with `ON CONFLICT DO NOTHING`; 2) If the key exists and status is 'completed', return the stored response immediately without re-processing; 3) If status is 'in_progress', return 409 Conflict; 4) Otherwise process the payment, update status to 'completed' with the response body, and commit.",
            "difficulty": "expert"
        },
        {
            "question": "How do PostgreSQL Advisory Locks differ from row-level locks, and when are they preferable for distributed coordination?",
            "answer": "Advisory locks (`pg_advisory_lock` / `pg_try_advisory_xact_lock`) are application-defined 64-bit integer locks managed directly in PostgreSQL memory without locking physical table rows. They are ideal for synchronizing application-level operations (e.g. preventing concurrent batch billing runs, single-worker cron leaders) without needing a dedicated lock table or external Redis cluster. Transaction-level advisory locks automatically release on commit/rollback, preventing accidental lock leaks on worker crashes.",
            "difficulty": "expert"
        }
    ],
    5: [
        {
            "question": "Why is Refresh Token Rotation with Reuse Detection critical, and how does it detect token theft?",
            "answer": "In Refresh Token Rotation (RTR), every time a refresh token is used to issue a new access token, the old refresh token is invalidated and a brand new refresh token is issued. Tokens are tracked in token families (`family_id`). If an attacker intercepts a used refresh token and tries to redeem it, the server detects that the token was already consumed. The server immediately invalidates the entire token family, revoking all active sessions for that user and forcing re-authentication.",
            "difficulty": "expert"
        },
        {
            "question": "What is the security rationale behind PKCE (Proof Key for Code Exchange) in OAuth 2.0 Authorization Code Flow?",
            "answer": "In public clients (SPAs, mobile apps), client secrets cannot be stored securely. An attacker could intercept the authorization code via custom URI schemes or browser history. PKCE generates a cryptographically random `code_verifier` on the client, computes `code_challenge = SHA256(code_verifier)`, and passes the challenge to the authorization server. When exchanging the authorization code, the client sends the plain `code_verifier`. The server hashes it and verifies it matches the original challenge. Even if an attacker steals the auth code, they cannot exchange it without the verifier.",
            "difficulty": "expert"
        },
        {
            "question": "How do you design a high-performance Role-Based Access Control (RBAC) permission check in FastAPI?",
            "answer": "Represent permissions as granular strings (`orders:read`, `orders:create`, `billing:admin`). Assign permissions to roles in PostgreSQL and cache the resolved user permission set in Redis (`user:{id}:permissions`) with a 15-minute TTL. In FastAPI, implement permission checks as reusable parameterized dependencies (`Depends(require_permission('orders:create'))`) that extract the user from the JWT/session, check the Redis set in O(1) time, and raise HTTP 403 Forbidden if absent.",
            "difficulty": "advanced"
        }
    ]
}

# Generic Staff Questions by topic keywords
GENERIC_STAFF_QUESTIONS = [
    {
        "keywords": ["redis", "cache", "caching"],
        "questions": [
            {
                "question": "What is a Cache Stampede (Dog-piling), and how do you mitigate it in a multi-container FastAPI cluster?",
                "answer": "A Cache Stampede occurs when a popular cache key expires, causing hundreds of concurrent requests to experience a cache miss and hit the database simultaneously. Mitigations: 1) Redis Distributed Lock with Double-Checked Locking (`SET NX PX`), ensuring only one worker queries the database while others wait; 2) Probabilistic Early Expiration (XFetch algorithm), where requests refresh the cache probabilistically before TTL expiration; 3) Background cache warming tasks.",
                "difficulty": "expert"
            },
            {
                "question": "When should you use Redis Lua scripts instead of MULTI/EXEC transactions?",
                "answer": "MULTI/EXEC transactions in Redis queue commands without allowing conditional branching based on intermediate values (you cannot read a value inside MULTI and use it in the next command of the same block). Lua scripts execute atomically in Redis single-threaded execution context, allowing complex conditional logic (e.g. token bucket rate limiting, check-and-decrement inventory) in a single round-trip without race conditions.",
                "difficulty": "expert"
            }
        ]
    },
    {
        "keywords": ["celery", "worker", "job", "queue", "background"],
        "questions": [
            {
                "question": "How do you guarantee idempotency in Celery background workers when broker acknowledgments are lost?",
                "answer": "Because message brokers (RabbitMQ/Redis) provide 'at-least-once' delivery, workers may receive the same task multiple times if a network partition occurs before the ACK is received. Tasks must be designed to be strictly idempotent: use unique idempotency keys or business state machines (`if order.status == 'processed': return`) with database unique constraints or atomic Redis locks.",
                "difficulty": "expert"
            },
            {
                "question": "What is the difference between Celery worker prefork, gevent, and threads concurrency models, and which should you choose for FastAPI background tasks?",
                "answer": "'prefork' uses multiprocessing (1 process per CPU core), ideal for CPU-bound tasks and non-async code. 'gevent' and 'eventlet' use greenlet coroutines, ideal for thousands of concurrent I/O-bound tasks using monkey patching. 'threads' uses OS threads. For modern Python async ecosystems, dedicated async queues like `ARQ` or `SAQ` running natively on `asyncio` are often preferred over Celery for lightweight I/O workers.",
                "difficulty": "expert"
            }
        ]
    },
    {
        "keywords": ["docker", "container", "kubernetes", "k8s", "deploy"],
        "questions": [
            {
                "question": "How do you configure Kubernetes liveness and readiness probes for a FastAPI service with database and Redis dependencies?",
                "answer": "Readiness Probe (`/health/ready`): Checks critical dependencies (PostgreSQL connection pool, Redis ping). If a dependency is down, K8s temporarily removes the Pod from Service endpoints so traffic isn't routed to a broken instance. Liveness Probe (`/health/live`): Checks ONLY that the Python event loop and Uvicorn process are responsive (returns 200 immediately). Never include database checks in liveness probes, or a brief DB blip will trigger a cascading restart of all Pods simultaneously.",
                "difficulty": "expert"
            },
            {
                "question": "Why is a 'preStop' hook and graceful shutdown configuration essential when deploying Uvicorn in Kubernetes?",
                "answer": "When a Pod is terminated, Kubernetes removes it from endpoints and sends `SIGTERM` simultaneously. Network iptables rules take several seconds to propagate across nodes. A `preStop` sleep hook (`sleep 5`) ensures the Pod continues accepting remaining inflight packets while traffic is rerouted. Setting `uvicorn --timeout-graceful-shutdown 30` allows active coroutines to finish database transactions before `SIGKILL`.",
                "difficulty": "expert"
            }
        ]
    },
    {
        "keywords": ["security", "owasp", "sql", "xss", "csrf", "ssrf"],
        "questions": [
            {
                "question": "How do you prevent Server-Side Request Forgery (SSRF) when your FastAPI application fetches user-provided URLs?",
                "answer": "1) Parse the URL and resolve its DNS to an IP address; 2) Validate that the IP is not in private/reserved ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` AWS metadata); 3) Disable HTTP redirects or re-validate IP on every redirect hop; 4) Restrict allowed schemes to `http` and `https`; 5) Enforce socket connection timeouts.",
                "difficulty": "expert"
            },
            {
                "question": "Why is Argon2id preferred over bcrypt and PBKDF2 for password hashing in production?",
                "answer": "Argon2id (the winner of the Password Hashing Competition) provides hybrid defense against both side-channel attacks and GPU/ASIC hardware-assisted cracking by incorporating both memory-hardness (requiring configurable megabytes of RAM) and time cost. PBKDF2 and bcrypt have fixed memory footprints, making them significantly easier to brute-force with dedicated FPGA/GPU clusters.",
                "difficulty": "advanced"
            }
        ]
    },
    {
        "keywords": ["observability", "metrics", "tracing", "prometheus", "opentelemetry"],
        "questions": [
            {
                "question": "How does OpenTelemetry propagate W3C Trace Context across asynchronous HTTP boundaries and message queues in FastAPI?",
                "answer": "OpenTelemetry injects and extracts the `traceparent` HTTP header (`00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`). An ASGI middleware intercepts the incoming header, starts a child span linked to the parent trace ID, and stores the span in Python's `contextvars.ContextVar`. When the application makes an outbound HTTP call via `httpx` or publishes to Kafka, the instrumentation automatically injects the current `traceparent` header.",
                "difficulty": "expert"
            },
            {
                "question": "What is the difference between Prometheus Counter, Gauge, and Histogram, and which should you use for tracking API latency in FastAPI?",
                "answer": "Counter: Monotonically increasing metric (resets only on restart), used for request counts and error totals. Gauge: Snapshot value that goes up and down, used for active connections and memory usage. Histogram: Samples observations into configurable buckets, used for request durations and response sizes. For API latency, always use Histogram to calculate p50, p95, and p99 percentiles across worker processes without skew from averages.",
                "difficulty": "advanced"
            }
        ]
    }
]

print("Enriching interview questions across all 25 chapters...")

import glob
files = sorted(glob.glob('src/lib/content/lessons/ch*-lessons.ts'))

# Read curriculum summary
with open('/tmp/curriculum_summary.json') as f:
    summary = json.load(f)

meta_by_ch = {c['id']: {l['slug']: l for l in c['lessons']} for c in summary}

for f in files:
    ch_num_match = re.search(r'ch(\d+)-lessons\.ts', f)
    if not ch_num_match:
        continue
    ch_num = int(ch_num_match.group(1))
    var_name = f"ch{ch_num:02d}Lessons"
    
    # We load the existing module
    module_name = f"ch{ch_num:02d}_mod"
    import importlib.util
    spec = importlib.util.spec_from_file_location(module_name, f)
    # Since it's TS, let's parse or use python generation
