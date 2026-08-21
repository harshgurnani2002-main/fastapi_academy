import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch15Lessons: Record<string, Lesson> = {
  'async-event-loop': {
    id: '15-01',
    slug: 'async-event-loop',
    chapterId: 15,
    order: 1,
    title: 'The Python Async Event Loop',
    description: 'Deep dive into the asyncio event loop execution model and measuring event loop lag.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.python, technologies.fastapi],
    prerequisites: ['14-01'],
    objectives: [
      'Explain asyncio event loop execution model',
      'Understand cooperative multitasking',
      'Identify blocking calls in async context',
      'Measure event loop lag under load',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Deconstructing the Event Loop',
        content: `At the heart of FastAPI is Starlette, which relies heavily on Python's \`asyncio\` event loop. The event loop is a single thread that executes asynchronous tasks cooperatively. When an \`await\` statement is reached, the current task yields control back to the event loop, allowing it to schedule and execute other pending tasks. 
        
This model is highly efficient for I/O-bound workloads (like network requests or database queries) because the thread doesn't sit idle while waiting for the response. However, if a task fails to yield control quickly—perhaps because it's executing a CPU-intensive calculation or a synchronous blocking call—it hogs the event loop, starving all other concurrent requests.

Measuring event loop lag is a critical metric for async applications. If the loop takes too long to complete a cycle, it indicates that blocking code is hindering your application's concurrency, manifesting as high latency across all endpoints, even those that do essentially nothing.`,
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Measuring Event Loop Lag in FastAPI',
        content: `To monitor event loop health in production, we can inject a background task that periodically measures how long it takes the event loop to execute a simple sleep. If the actual sleep time significantly exceeds the requested sleep time, we have event loop lag.`,
        codeExample: {
          id: 'event-loop-monitor',
          language: 'python',
          title: 'Event Loop Lag Monitor',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, BackgroundTasks
import asyncio
import time
import logging
from contextlib import asynccontextmanager
from app.monitoring import start_lag_monitor

logger = logging.getLogger("api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the monitor in the background
    monitor_task = asyncio.create_task(start_lag_monitor())
    yield
    monitor_task.cancel()

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health_check():
    return {"status": "ok"}`
            },
            'app/monitoring.py': {
              language: 'python',
              code: `import asyncio
import time
import logging

logger = logging.getLogger("api.monitor")

async def start_lag_monitor(interval: float = 1.0, threshold: float = 0.1):
    """
    Measures event loop lag. If the event loop is blocked for longer
    than \`threshold\` seconds, a warning is logged.
    """
    logger.info("Starting event loop lag monitor")
    try:
        while True:
            start_time = time.monotonic()
            await asyncio.sleep(interval)
            elapsed = time.monotonic() - start_time
            lag = elapsed - interval
            
            if lag > threshold:
                logger.warning(f"Event loop lag detected: {lag:.3f}s")
    except asyncio.CancelledError:
        logger.info("Event loop lag monitor stopped")`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Cooperative Multitasking Architecture',
        content: `In a multi-worker environment like Uvicorn + Gunicorn, each worker process runs its own event loop. Requests are load-balanced across workers by the operating system. 
        
When designing services, you must ensure that each endpoint respects the cooperative multitasking contract. A single endpoint performing a synchronous \`requests.get()\` or a complex regex search blocks its worker's event loop. If all workers are simultaneously handling such requests, the entire application becomes unresponsive, leading to cascading timeouts in upstream services. The event loop lag monitor is your early warning system for this architectural breakdown.`,
      }
    ],
    challenges: [
      {
        id: 'challenge-1',
        title: 'Implement Lag Metrics Export',
        description: 'Update the lag monitor to expose a gauge metric via Prometheus instead of just logging.',
        hint: 'Use the `prometheus_client` library to create a `Gauge` and set its value in the monitor loop.',
        solution: 'Define a Prometheus Gauge and update it on every iteration.',
        solutionCode: {
          id: 'solution-1',
          language: 'python',
          title: 'Prometheus Lag Monitor',
          filename: 'monitoring.py',
          code: `from prometheus_client import Gauge
import asyncio
import time

EVENT_LOOP_LAG = Gauge("fastapi_event_loop_lag_seconds", "Event loop lag in seconds")

async def start_lag_monitor(interval: float = 1.0):
    while True:
        start_time = time.monotonic()
        await asyncio.sleep(interval)
        lag = time.monotonic() - start_time - interval
        EVENT_LOOP_LAG.set(max(0.0, lag))`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'How does an async event loop differ from thread-based concurrency?',
        answer: 'An event loop uses cooperative multitasking on a single thread. Tasks must explicitly yield control (via `await`), whereas thread-based concurrency uses preemptive multitasking managed by the OS, which forces context switches. Event loops have much lower memory and context-switching overhead but are vulnerable to blocking operations.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Always monitor event loop lag in production. Unexplained latency spikes across fast endpoints are almost always caused by an unyielding task blocking the loop.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Unresponsive API',
        problem: 'During a traffic spike, health checks started failing and all endpoints timed out, even though CPU usage was only at 20% across all containers.',
        solution: 'A developer used the synchronous `requests` library inside an `async def` route to fetch data from an external API that was experiencing high latency. Because it was synchronous, the event loop was blocked waiting for the network, causing health checks to queue up and time out. The fix was switching to `httpx.AsyncClient`.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Mixing Sync and Async',
        description: 'Using synchronous I/O operations inside an `async def` endpoint blocks the entire event loop.',
        badCode: {
          id: 'bad-1',
          language: 'python',
          title: '❌ Sync Call in Async Route',
          code: `import requests
from fastapi import APIRouter

router = APIRouter()

@router.get("/data")
async def get_data():
    # BLOCKS THE EVENT LOOP!
    response = requests.get("https://api.example.com/data")
    return response.json()`
        },
        goodCode: {
          id: 'good-1',
          language: 'python',
          title: '✅ Async HTTP Client',
          code: `import httpx
from fastapi import APIRouter

router = APIRouter()

@router.get("/data")
async def get_data():
    async with httpx.AsyncClient() as client:
        # Yields control back to the event loop
        response = await client.get("https://api.example.com/data")
        return response.json()`
        }
      }
    ],
    codeExamples: [],
  },
  'blocking-calls': {
    id: '15-02',
    slug: 'blocking-calls',
    chapterId: 15,
    order: 2,
    title: 'Detecting & Fixing Blocking Calls',
    description: 'Master techniques to offload blocking synchronous operations to thread pools without sacrificing async throughput.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['15-01'],
    objectives: [
      'Use asyncio.get_event_loop().run_in_executor()',
      'Use asyncio.to_thread for sync functions',
      'Identify blocking libraries (requests, time.sleep)',
      'Measure throughput improvement after async migration',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Menace of Blocking Calls',
        content: `A blocking call is any operation that stops the execution of the thread it runs on, without yielding control to the event loop. Common culprits include traditional file I/O, CPU-bound computations, and synchronous network libraries like \`requests\` or \`urllib\`. 

When working with FastAPI, you sometimes must use a legacy or third-party library that only provides a synchronous API (e.g., specific database drivers, machine learning models, or enterprise SDKs). You cannot just put them in an \`async def\` route, but defining the route as a regular \`def\` isn't always viable if the route also needs to interact with async dependencies.

To safely execute blocking synchronous code within an asynchronous context, we must offload it to a separate thread pool. Python's \`asyncio\` provides mechanisms like \`run_in_executor\` and the newer, more ergonomic \`asyncio.to_thread\` to achieve this seamlessly.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Offloading to Threads',
        content: `Here we demonstrate how to properly wrap a legacy synchronous image processing function using \`asyncio.to_thread\`. This ensures that the heavy computation and synchronous file I/O do not block the FastAPI event loop.`,
        codeExample: {
          id: 'thread-offload',
          language: 'python',
          title: 'Async Wrapper for Legacy Sync Code',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, UploadFile, File, HTTPException
from app.services import process_image_async

app = FastAPI()

@app.post("/process-image")
async def process_endpoint(file: UploadFile = File(...)):
    if not file.filename.endswith('.jpg'):
        raise HTTPException(400, "Only JPG allowed")
        
    content = await file.read()
    
    # Offload the blocking operation to a thread
    result_path = await process_image_async(content, file.filename)
    
    return {"status": "success", "file_path": result_path}`
            },
            'app/services.py': {
              language: 'python',
              code: `import time
import asyncio
import logging

logger = logging.getLogger("api.services")

def legacy_sync_image_processor(image_bytes: bytes, filename: str) -> str:
    """
    A legacy synchronous function that does CPU-heavy work 
    and blocking I/O.
    """
    logger.info(f"Processing {filename} in thread...")
    # Simulate CPU-bound work and blocking I/O
    time.sleep(2.5) 
    
    output_path = f"/tmp/processed_{filename}"
    with open(output_path, "wb") as f:
        f.write(image_bytes)
        
    return output_path

async def process_image_async(image_bytes: bytes, filename: str) -> str:
    """
    Async wrapper using asyncio.to_thread to offload 
    the blocking call to the default ThreadPoolExecutor.
    """
    # to_thread runs the function in a separate thread and awaits its completion
    result = await asyncio.to_thread(
        legacy_sync_image_processor, 
        image_bytes, 
        filename
    )
    return result`
            }
          }
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Executor Tuning',
        content: `By default, \`asyncio.to_thread\` uses the event loop's default \`ThreadPoolExecutor\`, which has a max worker count based on \`min(32, os.cpu_count() + 4)\`. If you have a high volume of blocking calls, this default pool can quickly become exhausted, causing tasks to queue up.

In production environments dealing with significant blocking I/O, you should instantiate a dedicated \`ThreadPoolExecutor\` and use \`loop.run_in_executor()\` to isolate the thread pool. This prevents blocking I/O tasks from starving other parts of your application that might rely on the default thread pool.`
      }
    ],
    challenges: [
      {
        id: 'ch-2',
        title: 'Custom Thread Pool',
        description: 'Rewrite the service to use a custom ThreadPoolExecutor with 50 workers using `run_in_executor`.',
        hint: 'You will need `asyncio.get_running_loop()` and `concurrent.futures.ThreadPoolExecutor`.',
        solution: 'Create the executor globally, get the loop, and pass the executor to `run_in_executor`.',
        solutionCode: {
          id: 'sol-2',
          language: 'python',
          title: 'Custom Executor Offload',
          filename: 'services.py',
          code: `import asyncio
from concurrent.futures import ThreadPoolExecutor

# Create a dedicated pool
io_pool = ThreadPoolExecutor(max_workers=50)

def legacy_sync_task(data: str) -> str:
    import time
    time.sleep(1)
    return f"Processed {data}"

async def process_data_async(data: str) -> str:
    loop = asyncio.get_running_loop()
    # Execute in custom pool
    return await loop.run_in_executor(io_pool, legacy_sync_task, data)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-2',
        question: 'When should you declare a FastAPI route as `def` versus `async def`?',
        answer: 'Declare a route as `def` if the body of the function primarily executes blocking, synchronous operations (like using `requests` or `sqlalchemy` sync engine). FastAPI will automatically run `def` routes in an external threadpool. Use `async def` when you are awaiting async operations (like `httpx` or `sqlalchemy` async engine). Mixing blocking code into an `async def` route will stall the event loop.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-2',
        severity: 'warning',
        content: 'While `asyncio.to_thread` is convenient, remember that threads have context-switching overhead and memory footprint. It is a bridge, not a permanent architecture. Prefer native async libraries whenever possible.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-2',
        scenario: 'The Secret KMS Block',
        problem: 'A service used an AWS KMS SDK client to decrypt a payload. The SDK was synchronous. During Black Friday, decryption latency spiked, causing the entire FastAPI app to freeze.',
        solution: 'The team wrapped the synchronous KMS decryption call in `asyncio.to_thread`. This freed the main event loop to handle incoming requests and run other async I/O while the worker threads waited for AWS KMS.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-2',
        title: 'Unnecessary Thread Offloading',
        description: 'Using `run_in_executor` or `to_thread` for fast, non-blocking CPU operations adds unnecessary thread switching overhead.',
        badCode: {
          id: 'bad-2',
          language: 'python',
          title: '❌ Threading Simple Math',
          code: `async def calculate(a: int, b: int):
    # Massive overhead for a simple addition
    result = await asyncio.to_thread(lambda: a + b)
    return result`
        },
        goodCode: {
          id: 'good-2',
          language: 'python',
          title: '✅ Inline Execution',
          code: `async def calculate(a: int, b: int):
    # Simple, fast operations belong on the event loop
    return a + b`
        }
      }
    ],
    codeExamples: [],
  },
  'connection-pool-tuning': {
    id: '15-03',
    slug: 'connection-pool-tuning',
    chapterId: 15,
    order: 3,
    title: 'Connection Pool Tuning',
    description: 'Configure and monitor database connection pools to maximize throughput without overwhelming downstream databases.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.redis, technologies.sqlalchemy],
    prerequisites: ['15-02'],
    objectives: [
      'Measure connection pool wait time',
      'Set pool_size based on worker count',
      'Monitor connection pool exhaustion',
      'Configure connection health checks',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Connection Bottleneck',
        content: `A database connection pool maintains a set of open connections to a database, reusing them for future requests rather than paying the high TCP/TLS handshake cost for every query. In an async context with high concurrency, connection pool tuning becomes a critical balancing act.

If your \`pool_size\` is too small, incoming requests will spend excessive time waiting for a connection to become available, spiking latency (Connection Pool Exhaustion). If the \`pool_size\` is too large, you risk overwhelming the database with too many concurrent active queries, causing lock contention and memory exhaustion on the database server. 

When deploying multi-process servers (e.g., 4 Gunicorn workers), remember that the connection pool is per-process. A \`pool_size\` of 20 with 4 workers means up to 80 open connections to PostgreSQL.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'SQLAlchemy Async Pool Configuration',
        content: `Properly configuring the SQLAlchemy \`AsyncEngine\` requires setting the \`pool_size\`, \`max_overflow\`, and \`pool_timeout\`. We also implement a \`pool_pre_ping\` to ensure stale connections dropped by firewalls are seamlessly reconnected.`,
        codeExample: {
          id: 'sqlalchemy-pool',
          language: 'python',
          title: 'Optimized SQLAlchemy Engine',
          files: {
            'app/database.py': {
              language: 'python',
              code: `from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger("db")

DATABASE_URL = "postgresql+asyncpg://user:pass@db:5432/app"

# Configuration for a high-concurrency production environment
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    # Base number of connections maintained in the pool
    pool_size=20,
    # Connections allowed to be created beyond pool_size under load
    max_overflow=10,
    # Time in seconds to wait for a connection before throwing TimeoutError
    pool_timeout=5.0,
    # Time in seconds before a connection is recycled (prevents DB-side disconnects)
    pool_recycle=1800,
    # Verifies connection health before checkout (SELECT 1)
    pool_pre_ping=True
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)`
            },
            'app/dependencies.py': {
              language: 'python',
              code: `from app.database import AsyncSessionLocal
from sqlalchemy.exc import TimeoutError
from fastapi import HTTPException
import logging

logger = logging.getLogger("api")

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except TimeoutError:
            # Handle pool exhaustion gracefully
            logger.error("Database connection pool exhausted")
            raise HTTPException(
                status_code=503, 
                detail="Service temporarily unavailable (Database overloaded)"
            )`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Connection Pool Sizing Formula',
        content: `A common myth is that more connections equal higher performance. In reality, PostgreSQL performs optimally when the number of active connections is close to the number of CPU cores it possesses. 

A standard formula for PostgreSQL max connections is: \`((core_count * 2) + effective_spindle_count)\`. 
If your DB allows 100 connections, and you have 4 application pods, each running 2 Uvicorn workers, you have 8 total processes. 
To avoid hitting the DB limit, each process should have a maximum pool size (\`pool_size + max_overflow\`) of around 12 (\`100 / 8 = 12.5\`). 

If your application requires more concurrency than this allows, you must introduce a connection bouncer like PgBouncer in transaction-pooling mode. PgBouncer sits between your app and the DB, allowing the app to open thousands of connections while multiplexing them onto a small number of actual DB connections.`
      }
    ],
    challenges: [
      {
        id: 'ch-3',
        title: 'Monitor Pool Usage',
        description: 'SQLAlchemy event listeners can be used to monitor checkout times. Write an event listener for `checkout` that logs a warning if acquiring the connection took more than 50ms.',
        hint: 'You will need to use `sqlalchemy.event.listen` on the engine. The `checkout` event passes the connection record.',
        solution: 'Attach an event listener tracking checkout times via `info` dict on the connection record.',
        solutionCode: {
          id: 'sol-3',
          language: 'python',
          title: 'Pool Wait Time Monitoring',
          filename: 'database.py',
          code: `import time
import logging
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine

logger = logging.getLogger("db.pool")
engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")

@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    # This runs when a connection is checked out of the pool
    checkout_start = connection_record.info.get("checkout_start")
    if checkout_start:
        duration = time.monotonic() - checkout_start
        if duration > 0.05:
            logger.warning(f"Slow DB pool checkout: {duration*1000:.1f}ms")

@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    # Reset timer when returned
    connection_record.info["checkout_start"] = time.monotonic()`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-3',
        question: 'What happens when `pool_timeout` is reached in SQLAlchemy?',
        answer: 'A `TimeoutError` is raised. This means the application requested a connection from the pool, but all connections were actively in use, and none were returned to the pool within the `pool_timeout` duration. It usually indicates either slow queries holding connections too long, or a surge in traffic exceeding the pool capacity.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-3',
        severity: 'critical',
        content: 'Never deploy a production application against PostgreSQL without PgBouncer (or RDS Proxy) if you plan to scale beyond a few workers. SQLAlchemy pooling is per-process; PgBouncer pools globally.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-3',
        scenario: 'The Silent Killer: Idle in Transaction',
        problem: 'The application frequently experienced `TimeoutError` on DB checkouts, but the database CPU was nearly 0%.',
        solution: 'A bug in the application code opened a session, executed a query, but an unhandled exception occurred before `commit()` or `rollback()`. The session was not closed, holding the connection open in an "Idle in Transaction" state. Enforcing `async with` context managers for sessions ensured connections were cleanly returned to the pool regardless of errors.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-3',
        title: 'Ignoring Connection Drops',
        description: 'Firewalls and load balancers often silently drop idle TCP connections. If the app tries to use a dropped connection, it will throw a fatal error.',
        badCode: {
          id: 'bad-3',
          language: 'python',
          title: '❌ Vulnerable Pool',
          code: `engine = create_async_engine(
    DATABASE_URL,
    pool_size=20
    # Missing pool_pre_ping and pool_recycle
)`
        },
        goodCode: {
          id: 'good-3',
          language: 'python',
          title: '✅ Resilient Pool',
          code: `engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    pool_pre_ping=True,       # Verifies connection before use
    pool_recycle=1800         # Recycles connections older than 30 mins
)`
        }
      }
    ],
    codeExamples: [],
  },
  'pydantic-performance': {
    id: '15-04',
    slug: 'pydantic-performance',
    chapterId: 15,
    order: 4,
    title: 'Pydantic v2 Performance Optimization',
    description: 'Leverage Pydantic v2 Rust core for ultra-fast validation and serialization in high-throughput endpoints.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.pydantic, technologies.python],
    prerequisites: ['15-03'],
    objectives: [
      'Profile Pydantic validation with py-spy',
      'Use model_validate() instead of constructors',
      'Use response_model_exclude for serialization',
      'Cache schema compilation results',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Rust Advantage in Pydantic v2',
        content: `Data validation and JSON serialization are historically CPU-intensive operations in Python web frameworks. Pydantic v2 revolutionized this by rewriting its core in Rust (\`pydantic-core\`). While v2 is significantly faster out of the box, poorly designed schemas and inefficient initialization patterns can still bottleneck your FastAPI application.

When FastAPI receives a request, Pydantic validates the JSON payload into a Python object. When sending a response, it serializes the Python object back to JSON. At high throughput (thousands of RPS), the microseconds spent instantiating models and allocating memory add up. Profiling often reveals that Pydantic constructors and dictionary dumping (\`model_dump\`) consume the majority of CPU cycles in simple CRUD endpoints.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Optimizing Model Construction & Serialization',
        content: `Instantiating models via \`Model(key=value)\` incurs slight overhead due to Python keyword argument unpacking. Using \`Model.model_validate(dict)\` or \`Model.model_validate_json(string)\` bypasses this, hooking directly into the Rust core. Furthermore, dynamically filtering output fields in the endpoint using \`response_model_exclude\` is cleaner and often faster than manipulating dictionaries manually.`,
        codeExample: {
          id: 'pydantic-opt',
          language: 'python',
          title: 'High-Performance Validation',
          files: {
            'app/schemas.py': {
              language: 'python',
              code: `from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class UserRead(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    # Optimize memory usage for instances
    model_config = ConfigDict(
        from_attributes=True, 
        # Prevents adding extra fields, enabling tighter memory layout
        extra='ignore' 
    )

class UserList(BaseModel):
    users: List[UserRead]`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI
from app.schemas import UserRead
from typing import List

app = FastAPI()

# Assume this comes from a fast cache or raw DB row
raw_db_records = [
    {"id": 1, "username": "alice", "email": "a@x.com", "is_active": True, "secret": "hash1"},
    {"id": 2, "username": "bob", "email": "b@x.com", "is_active": False, "secret": "hash2"}
]

@app.get("/users/fast", response_model=List[UserRead])
async def get_users_fast():
    # FAST: Let FastAPI handle serialization, we just return the raw dicts or ORM objects.
    # FastAPI's internal Pydantic integration is heavily optimized to validate and filter
    # the response based on response_model.
    return raw_db_records

@app.post("/users/bulk-import")
async def bulk_import(payload: bytes):
    # FASTEST JSON parsing: directly from bytes using Rust core
    # Bypass standard FastAPI dependency injection if raw speed on massive payloads is needed
    from app.schemas import UserList
    
    # Validates directly from JSON string/bytes without intermediate python dict
    parsed_data = UserList.model_validate_json(payload)
    return {"processed": len(parsed_data.users)}`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Bypassing Validation for Read-Only Data',
        content: `In extreme performance scenarios, you might cache serialized JSON strings in Redis. If the data is guaranteed to be valid (because it was validated upon insertion), passing it back through Pydantic upon retrieval is wasteful. 

You can use FastAPI's \`Response\` classes directly to return pre-serialized JSON, completely bypassing Pydantic. This can increase endpoint throughput by an order of magnitude for read-heavy cache-hit scenarios.`
      }
    ],
    challenges: [
      {
        id: 'ch-4',
        title: 'Bypass Pydantic with Response',
        description: 'Create an endpoint that fetches a raw JSON string from Redis and returns it directly using `fastapi.responses.JSONResponse` or `Response`, bypassing validation.',
        hint: 'If you use `Response(content=redis_data, media_type="application/json")`, FastAPI avoids all JSON encoding overhead.',
        solution: 'Use `Response` with `media_type="application/json"` to serve the raw string.',
        solutionCode: {
          id: 'sol-4',
          language: 'python',
          title: 'Raw Response Optimization',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Response
import redis.asyncio as redis

app = FastAPI()
redis_client = redis.Redis(host='localhost', port=6379)

@app.get("/cached-data")
async def get_cached_data():
    # redis_data is a raw JSON bytes string
    redis_data = await redis_client.get("cache:hot-data")
    if redis_data:
        # Zero overhead: No Pydantic validation, no JSON serialization
        return Response(content=redis_data, media_type="application/json")
    
    return {"message": "Cache miss"}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-4',
        question: 'Why is `model_validate_json` faster than `model_validate(json.loads(data))` in Pydantic v2?',
        answer: '`json.loads` creates an intermediate Python dictionary in memory, involving significant object allocation. `model_validate_json` parses the JSON string directly in Rust and instantiates the Pydantic model in a single pass, avoiding the intermediate Python dictionary allocation entirely.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-4',
        severity: 'info',
        content: 'When generating OpenAPI schemas for massive Pydantic models on application startup, it can delay boot times. This is normal, as Pydantic compiles the core schemas once on initialization.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-4',
        scenario: 'The Heavy Serialization Bottleneck',
        problem: 'An endpoint returning 10,000 records of time-series data took 800ms to respond, consuming 100% of a CPU core.',
        solution: 'Profiling revealed `pydantic.model_dump` and JSON serialization were the culprits. Since the data was queried directly from the DB and didn\'t need strict outgoing validation, the team swapped to returning raw dictionaries and used `orjson` as the custom JSON serializer for FastAPI, dropping response time to 40ms.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-4',
        title: 'Manual Dictionary Construction',
        description: 'Manually unpacking dictionaries to construct models is slower and more error-prone than using built-in methods.',
        badCode: {
          id: 'bad-4',
          language: 'python',
          title: '❌ kwargs Unpacking',
          code: `data_dict = {"id": 1, "name": "Test"}
# Slower: Python unpacks the dict, Pydantic checks kwargs
user = User(**data_dict)`
        },
        goodCode: {
          id: 'good-4',
          language: 'python',
          title: '✅ model_validate',
          code: `data_dict = {"id": 1, "name": "Test"}
# Faster: Direct hook into pydantic-core
user = User.model_validate(data_dict)`
        }
      }
    ],
    codeExamples: [],
  },
  'database-query-optimization': {
    id: '15-05',
    slug: 'database-query-optimization',
    chapterId: 15,
    order: 5,
    title: 'Database Query Optimization',
    description: 'Diagnose and resolve N+1 queries, leverage EXPLAIN, and optimize SQLAlchemy relationships.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.sqlalchemy],
    prerequisites: ['15-03'],
    objectives: [
      'Enable slow query logging',
      'Identify missing indexes with EXPLAIN',
      'Eliminate N+1 queries systematically',
      'Use query result caching for static data',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Database as the Final Bottleneck',
        content: `Regardless of how optimized your async event loop or Pydantic models are, the vast majority of web application latency originates in the database layer. Database query optimization is about reducing the number of queries, reducing the volume of data transferred, and ensuring the database engine can find data efficiently.

The most notorious performance killer in ORMs like SQLAlchemy is the "N+1 query problem." This occurs when you query a list of entities (1 query) and then access a related entity for each item in the list, triggering a new query for each item (N queries). If the list has 1000 items, you execute 1001 database queries to fulfill a single API request.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Defeating the N+1 Problem',
        content: `SQLAlchemy provides loader strategies—\`selectinload\` and \`joinedload\`—to eagerly fetch related data. \`selectinload\` emits a second SELECT statement with an IN clause matching the parent IDs, while \`joinedload\` uses a SQL JOIN. For async SQLAlchemy, \`selectinload\` is generally preferred for collections (one-to-many) to avoid complex JOIN Cartesian products.`,
        codeExample: {
          id: 'n-plus-1',
          language: 'python',
          title: 'Eager Loading Relationships',
          files: {
            'app/models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Author(Base):
    __tablename__ = "authors"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    # Relationship to books
    books = relationship("Book", back_populates="author")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    author_id = Column(Integer, ForeignKey("authors.id"))
    author = relationship("Author", back_populates="books")`
            },
            'app/repositories.py': {
              language: 'python',
              code: `from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from app.models import Author, Book

async def get_authors_with_books_slow(session):
    # ❌ BAD: This will cause N+1 when accessing author.books
    result = await session.execute(select(Author))
    return result.scalars().all()

async def get_authors_with_books_fast(session):
    # ✅ GOOD: selectinload fetches all books for all authors in 1 extra query
    stmt = select(Author).options(selectinload(Author.books))
    result = await session.execute(stmt)
    return result.scalars().all()
    
async def get_books_with_authors(session):
    # ✅ GOOD: joinedload is perfect for Many-to-One
    stmt = select(Book).options(joinedload(Book.author))
    result = await session.execute(stmt)
    return result.scalars().all()`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'EXPLAIN ANALYZE and Indexing',
        content: `When a single query is slow, you must use the database engine's \`EXPLAIN ANALYZE\` command. It reveals the execution plan, showing whether the DB used an index (\`Index Scan\`) or had to scan every row in the table (\`Seq Scan\`). 

If you frequently filter or sort by a specific column, it requires an index. However, over-indexing slows down \`INSERT\` and \`UPDATE\` operations. A healthy balance requires monitoring slow query logs, identifying missing indexes for read-heavy operations, and periodically removing unused indexes.`
      }
    ],
    challenges: [
      {
        id: 'ch-5',
        title: 'Composite Indexes',
        description: 'Define a SQLAlchemy model with a composite index on `last_name` and `first_name` to optimize queries that search by both fields simultaneously.',
        hint: 'Use the `Index` construct from `sqlalchemy` and place it in the `__table_args__` tuple of the model.',
        solution: 'Define `__table_args__ = (Index("idx_name", "last_name", "first_name"),)`',
        solutionCode: {
          id: 'sol-5',
          language: 'python',
          title: 'Composite Index Definition',
          filename: 'models.py',
          code: `from sqlalchemy import Column, Integer, String, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    
    # Creates a composite index spanning both columns
    __table_args__ = (
        Index("idx_user_last_first", "last_name", "first_name"),
    )`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-5',
        question: 'What is the difference between `joinedload` and `selectinload` in SQLAlchemy?',
        answer: '`joinedload` emits a single SQL query using a LEFT OUTER JOIN to load the parent and related entities. It is highly efficient for many-to-one or one-to-one relationships. `selectinload` emits a second query using an IN clause containing the primary keys of the parents. It is the preferred method for loading collections (one-to-many) because using `joinedload` for collections causes a Cartesian product, returning massive amounts of duplicated parent data over the network.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-5',
        severity: 'critical',
        content: 'Turn on PostgreSQL slow query logging (e.g., `log_min_duration_statement = 500ms`). Integrating this with a log aggregator will highlight queries that degrade under production volume before they cause outages.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-5',
        scenario: 'The Cartesian Explosion',
        problem: 'An endpoint loading a `Company` with its `Employees` and `Projects` used multiple `joinedload` directives. When a company had 1000 employees and 100 projects, the DB returned 100,000 duplicated rows over the network, crashing the app out of memory.',
        solution: 'The team replaced the multiple `joinedload` directives on collections with `selectinload`. This changed the execution from one massive Cartesian JOIN to three small, efficient queries, instantly resolving the OOM errors and dropping latency from seconds to milliseconds.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-5',
        title: 'Implicit IO in Async',
        description: 'Attempting to access an unloaded relationship in async SQLAlchemy raises an error, but in sync SQLAlchemy, it silently triggers a blocking N+1 query.',
        badCode: {
          id: 'bad-5',
          language: 'python',
          title: '❌ Lazy Loading (Sync Mode)',
          code: `users = session.query(User).all()
for user in users:
    # Triggers a hidden DB query per user!
    print(user.profile.bio)`
        },
        goodCode: {
          id: 'good-5',
          language: 'python',
          title: '✅ Eager Loading',
          code: `stmt = select(User).options(joinedload(User.profile))
result = await session.execute(stmt)
users = result.scalars().all()

for user in users:
    # No query triggered, data is already loaded
    print(user.profile.bio)`
        }
      }
    ],
    codeExamples: [],
  },
  'load-testing-locust': {
    id: '15-06',
    slug: 'load-testing-locust',
    chapterId: 15,
    order: 6,
    title: 'Load Testing with Locust',
    description: 'Simulate concurrent traffic spikes to find the breaking point and throughput ceiling of your API.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['15-01'],
    objectives: [
      'Write Locust user scenarios',
      'Run distributed load tests',
      'Interpret Locust results (RPS, P95, P99)',
      'Find the throughput ceiling of your API',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Why Load Test?',
        content: `Your API might respond in 10ms when you test it locally with a single request. But what happens when 500 users request that same endpoint simultaneously? Load testing is the discipline of simulating concurrent user traffic to observe how the system degrades under stress.

Locust is a Python-based open-source load testing tool. Unlike tools configured via XML or complex UIs, Locust allows you to define user behavior in plain Python code. This makes it incredibly flexible; you can simulate complex workflows (e.g., login, fetch data, submit form) respecting real-world probabilistic distributions.

The goal is to find your API's throughput ceiling (maximum Requests Per Second) and observe latency percentiles (P95, P99) as the system reaches capacity.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Writing a Locustfile',
        content: `A Locustfile defines classes that inherit from \`HttpUser\`. You define tasks using the \`@task\` decorator. The \`wait_time\` parameter simulates the "think time" between a user's actions.`,
        codeExample: {
          id: 'locust-script',
          language: 'python',
          title: 'Locust Load Test Script',
          filename: 'locustfile.py',
          code: `from locust import HttpUser, task, between, events
import random

class APIUser(HttpUser):
    # Simulate a user waiting between 1 and 3 seconds between actions
    wait_time = between(1, 3)
    
    def on_start(self):
        """Called when a Locust user starts before any task is scheduled"""
        # E.g., Login and get a token
        response = self.client.post("/auth/login", json={
            "username": "testuser",
            "password": "password123"
        })
        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.headers = {}

    @task(3) # Weight of 3 (executes 3x more often than weight 1)
    def read_items(self):
        self.client.get("/items/", headers=self.headers, name="/items/")

    @task(1)
    def create_item(self):
        item_id = random.randint(1000, 9999)
        self.client.post(
            "/items/", 
            headers=self.headers,
            json={"name": f"Item {item_id}", "price": 9.99},
            name="/items/ [POST]"
        )

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("Starting load test...")`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Interpreting the Results',
        content: `When analyzing load test results, Average Latency is a deceptive metric. A few massive outliers can skew the average, or worse, a large cluster of slow requests can be masked by an ocean of fast ones.

Instead, look at the Percentiles:
- **P50 (Median)**: 50% of requests are faster than this.
- **P95**: 95% of requests are faster than this. This represents the tail latency.
- **P99**: The experience of the slowest 1% of requests.

If RPS stops increasing despite adding more concurrent users, and P95 latency spikes dramatically, you have hit a bottleneck. This could be CPU exhaustion, database connection pool limits, or a blocked event loop.`
      }
    ],
    challenges: [
      {
        id: 'ch-6',
        title: 'Run Locust Headless',
        description: 'Provide the terminal command to run the Locust test script (`locustfile.py`) without the web UI, targeting `http://localhost:8000`, spawning 100 users at a rate of 10 users per second, and running for 1 minute.',
        hint: 'You need the `--headless`, `-u`, `-r`, `-t`, and `-H` flags.',
        solution: 'Run: `locust -f locustfile.py --headless -u 100 -r 10 -t 1m -H http://localhost:8000`',
        solutionCode: {
          id: 'sol-6',
          language: 'bash',
          title: 'Headless Execution',
          filename: 'terminal',
          code: `locust -f locustfile.py --headless -u 100 -r 10 -t 1m -H http://localhost:8000`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-6',
        question: 'Why do we use P95 or P99 metrics instead of Average Latency when evaluating performance?',
        answer: 'Averages hide the outliers. In a distributed system, a small percentage of extremely slow requests can indicate fundamental architectural problems (like garbage collection pauses or lock contention). P95 and P99 provide a realistic view of the worst-case user experience. If P99 is high, 1 out of 100 users is having a terrible experience, which is unacceptable at scale.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-6',
        severity: 'warning',
        content: 'Never run write-heavy load tests against a production database. The generated data will pollute metrics and could inadvertently trigger downstream side-effects like emails or billing.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-6',
        scenario: 'The Hidden Memory Leak',
        problem: 'The API performed flawlessly under normal load but crashed after 4 hours of sustained high traffic.',
        solution: 'Running a long-duration Locust test (soak testing) revealed a slow memory leak in a third-party logging library. The constant influx of requests caused memory to gradually swell until the OS OOM-killer terminated the process. The soak test allowed the team to reproduce and patch the leak safely in staging.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-6',
        title: 'Hardcoding IDs in URLs',
        description: 'If you dynamically generate URLs in Locust without grouping them, Locust will treat every unique URL as a separate endpoint in the statistics, making results unreadable.',
        badCode: {
          id: 'bad-6',
          language: 'python',
          title: '❌ Dynamic URL explosion',
          code: `@task
def get_user(self):
    user_id = random.randint(1, 100)
    # Locust sees 100 different endpoints
    self.client.get(f"/users/{user_id}")`
        },
        goodCode: {
          id: 'good-6',
          language: 'python',
          title: '✅ Grouping via Name',
          code: `@task
def get_user(self):
    user_id = random.randint(1, 100)
    # The 'name' parameter groups the stats
    self.client.get(f"/users/{user_id}", name="/users/[id]")`
        }
      }
    ],
    codeExamples: [],
  },
  'profiling-py-spy': {
    id: '15-07',
    slug: 'profiling-py-spy',
    chapterId: 15,
    order: 7,
    title: 'Production Profiling with py-spy',
    description: 'Use py-spy to generate flame graphs and identify CPU bottlenecks in running processes with zero code changes.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.python, technologies.fastapi],
    prerequisites: ['15-06'],
    objectives: [
      'Attach py-spy to a running process',
      'Generate flame graphs from py-spy output',
      'Identify top CPU-consuming functions',
      'Profile async code correctly',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Non-Intrusive Profiling',
        content: `When your application is suffering from high CPU usage, guessing the bottleneck is futile. You need cold, hard data. Traditional profilers like \`cProfile\` require code modifications, slow down the application significantly, and are difficult to use in a live production environment.

\`py-spy\` is a sampling profiler for Python. It works by reading the memory of the Python process from the outside, meaning you don't need to change a single line of your code or restart the application. It incurs extremely low overhead, making it safe to attach to a live production server.

By taking rapid snapshots of the Python call stack, \`py-spy\` visualizes exactly which functions are consuming the most CPU time, presenting the results as an intuitive Flame Graph.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Generating a Flame Graph',
        content: `A Flame Graph is a visualization where the x-axis represents the population of samples (CPU time) and the y-axis represents stack depth (call hierarchy). Wide blocks indicate functions that take a long time to execute.`,
        codeExample: {
          id: 'pyspy-cmd',
          language: 'bash',
          title: 'Using py-spy via CLI',
          filename: 'terminal',
          code: `# 1. Find the Process ID (PID) of your FastAPI worker
ps aux | grep uvicorn

# 2. Record a profile for 60 seconds and output an interactive SVG
sudo py-spy record -o profile.svg --pid 12345 --duration 60

# 3. View the top functions actively consuming CPU in real-time (like top/htop)
sudo py-spy top --pid 12345

# 4. Dump the current call stack of all threads (useful for deadlocks)
sudo py-spy dump --pid 12345`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Profiling in Docker and Kubernetes',
        content: `Running \`py-spy\` inside a containerized environment requires elevated privileges because it needs access to process memory spaces. 

In Docker, you must run the container with \`--cap-add SYS_PTRACE\`. In Kubernetes, you can inject an ephemeral debug container that shares the process namespace of your application pod, allowing you to run \`py-spy\` against the live application without permanently compromising security policies.`
      }
    ],
    challenges: [
      {
        id: 'ch-7',
        title: 'Profiling an Async Script',
        description: 'You have a script `app.py` that you want to profile from the moment it starts until it finishes, rather than attaching to a PID. Write the command.',
        hint: 'Use the `record` command but pass `python app.py` instead of a `--pid`.',
        solution: '`sudo py-spy record -o profile.svg -- python app.py`',
        solutionCode: {
          id: 'sol-7',
          language: 'bash',
          title: 'Profile execution',
          filename: 'terminal',
          code: `sudo py-spy record -o profile.svg -- python app.py`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-7',
        question: 'What is the difference between a sampling profiler (like py-spy) and a deterministic profiler (like cProfile)?',
        answer: 'A deterministic profiler hooks into every function call and return, tracking exact execution counts and times. This adds massive overhead (sometimes 2x-5x slowdown). A sampling profiler periodically interrupts the process (e.g., 100 times per second) to record the current call stack. It provides statistical data with minimal overhead (often < 1%), making it safe for production.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-7',
        severity: 'info',
        content: 'When viewing an async Flame Graph, you will often see the `asyncio` event loop machinery (`run_once`, `_run`, etc.) taking up the bottom layers. Focus on the wide blocks at the top of the towers to find your application logic.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-7',
        scenario: 'The Hidden Regex Trap',
        problem: 'Under heavy load, an API began dropping requests. CPU was pegged at 100%. Code review revealed nothing obvious.',
        solution: 'The team ran `py-spy record` for 30 seconds. The resulting Flame Graph showed a massive, wide block originating from the `re.compile` module. A developer had placed a complex regex compilation inside a data parsing loop instead of at the module level. Moving it out of the loop resolved the CPU spike immediately.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-7',
        title: 'Misinterpreting I/O Wait',
        description: 'By default, py-spy only measures CPU time. If a function is slow because it is waiting for a database (I/O), it won\'t appear wide on the flame graph.',
        badCode: {
          id: 'bad-7',
          language: 'bash',
          title: '❌ Missing I/O Delays',
          code: `# Only profiles active CPU usage
sudo py-spy record -o profile.svg --pid 1234`
        },
        goodCode: {
          id: 'good-7',
          language: 'bash',
          title: '✅ Include Idle/Wait Time',
          code: `# Includes time spent waiting on locks or I/O
sudo py-spy record --idle -o profile.svg --pid 1234`
        }
      }
    ],
    codeExamples: [],
  },
  'cpu-bound-workloads': {
    id: '15-08',
    slug: 'cpu-bound-workloads',
    chapterId: 15,
    order: 8,
    title: 'CPU-Bound Workloads in FastAPI',
    description: 'Architect solutions for heavy computations using ProcessPools and distributed task queues like Celery.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.celery, technologies.python],
    prerequisites: ['15-02'],
    objectives: [
      'Use ProcessPoolExecutor for CPU-bound tasks',
      'Offload CPU work to Celery workers',
      'Measure parallelism improvement',
      'Balance worker processes vs threads',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Global Interpreter Lock (GIL)',
        content: `Due to Python's Global Interpreter Lock (GIL), multiple threads cannot execute Python bytecode simultaneously. Therefore, using \`ThreadPoolExecutor\` or \`asyncio.to_thread\` does not help with CPU-bound tasks (like image processing, cryptography, or heavy data crunching). If you put a heavy calculation in a thread, it will still lock the process and degrade overall performance.

To achieve true parallelism for CPU-bound tasks in Python, you must use multiple processes. Each process has its own memory space and its own GIL. 

In a FastAPI context, you have two architectural choices for CPU workloads:
1. **In-process pool**: Use \`ProcessPoolExecutor\` for quick but intense computations.
2. **Out-of-process queue**: Offload to a distributed task queue like Celery or RQ for long-running computations.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Using ProcessPoolExecutor',
        content: `For tasks that take a fraction of a second but are highly CPU intensive, you can maintain a \`ProcessPoolExecutor\` alongside your FastAPI app. Note that data passed to processes must be serialized (pickled), which adds overhead.`,
        codeExample: {
          id: 'process-pool',
          language: 'python',
          title: 'Multiprocessing in FastAPI',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI
import asyncio
from concurrent.futures import ProcessPoolExecutor
from app.compute import heavy_computation

app = FastAPI()
# Initialize a pool with workers equal to CPU cores
process_pool = ProcessPoolExecutor()

@app.on_event("shutdown")
def shutdown_event():
    process_pool.shutdown(wait=True)

@app.post("/calculate")
async def calculate_endpoint(data: list[int]):
    loop = asyncio.get_running_loop()
    # Offload the heavy computation to a separate process
    # The event loop remains unblocked and handles other requests
    result = await loop.run_in_executor(
        process_pool, 
        heavy_computation, 
        data
    )
    return {"result": result}`
            },
            'app/compute.py': {
              language: 'python',
              code: `def heavy_computation(data: list[int]) -> int:
    """A highly CPU-intensive function"""
    result = 0
    # Simulate intense math
    for item in data:
        for i in range(10000):
            result += (item * i) ** 0.5
    return int(result)`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Offloading to Celery',
        content: `If a CPU-bound task takes more than a few seconds (e.g., generating a massive PDF report, or processing ML models), using an in-memory \`ProcessPoolExecutor\` is risky. A server restart will lose the data, and HTTP requests will time out.

The robust architecture uses FastAPI to quickly accept the payload, save state to a database, and publish a message to a broker (RabbitMQ/Redis). A fleet of Celery workers running on separate infrastructure consumes the messages and performs the CPU-heavy work, updating the database upon completion. FastAPI endpoints then simply check the database status (polling or websockets).`
      }
    ],
    challenges: [
      {
        id: 'ch-8',
        title: 'Celery Offload Architecture',
        description: 'Write an endpoint that triggers a Celery task `generate_report` and returns the `task_id` immediately.',
        hint: 'Use the `delay()` method on the Celery task.',
        solution: 'Call `generate_report.delay(payload)` and return the resulting `.id`.',
        solutionCode: {
          id: 'sol-8',
          language: 'python',
          title: 'Trigger Celery Task',
          filename: 'main.py',
          code: `from fastapi import FastAPI
from app.worker import generate_report
from pydantic import BaseModel

app = FastAPI()

class ReportRequest(BaseModel):
    user_id: int
    data_range: str

@app.post("/reports")
async def create_report(request: ReportRequest):
    # Sends message to broker, returns immediately
    task = generate_report.delay(request.user_id, request.data_range)
    
    return {
        "status": "processing",
        "task_id": task.id,
        "poll_url": f"/reports/status/{task.id}"
    }`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-8',
        question: 'Why should you be careful about the arguments you pass to `ProcessPoolExecutor` or Celery tasks?',
        answer: 'Arguments must be serialized (pickled). If you pass massive datasets, complex ORM objects, or unpicklable types (like open file handles or DB connections), the serialization process itself becomes a massive CPU and memory bottleneck, and may crash. It is always better to pass primitive IDs (like `user_id`) and have the worker process fetch the data it needs directly from the database.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-8',
        severity: 'critical',
        content: 'When using ProcessPoolExecutor in a web server, never instantiate the pool inside the route handler. Always create it globally at startup, otherwise you will spawn new OS processes on every single request, quickly destroying the server.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-8',
        scenario: 'The ML Model Stalling',
        problem: 'An image classification API using PyTorch stalled all concurrent requests whenever an image was uploaded. The developer had used `asyncio.to_thread` to offload the prediction.',
        solution: 'Because PyTorch inference was purely CPU-bound (not I/O bound), `to_thread` still locked the process via the GIL. Replacing `to_thread` with `ProcessPoolExecutor` moved the inference to a separate process, restoring concurrency to the main API process.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-8',
        title: 'Returning Complex Objects from Processes',
        description: 'Returning massive or complex objects from a separate process forces Python to serialize and deserialize them across IPC pipes, destroying performance.',
        badCode: {
          id: 'bad-8',
          language: 'python',
          title: '❌ Heavy IPC Transfer',
          code: `def fetch_and_process():
    # Returns 500MB of processed data structures
    return massive_processed_list

result = await loop.run_in_executor(pool, fetch_and_process)`
        },
        goodCode: {
          id: 'good-8',
          language: 'python',
          title: '✅ Storage Handoff',
          code: `def process_and_save():
    # Processes data and saves to DB/S3, returns only primitive ID
    s3_path = save_to_s3(massive_processed_list)
    return s3_path

result_path = await loop.run_in_executor(pool, process_and_save)`
        }
      }
    ],
    codeExamples: [],
  },
  'response-streaming': {
    id: '15-09',
    slug: 'response-streaming',
    chapterId: 15,
    order: 9,
    title: 'Response Streaming for Large Payloads',
    description: 'Stream massive datasets and files without consuming server RAM.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['15-05'],
    objectives: [
      'Implement StreamingResponse for large datasets',
      'Stream database query results',
      'Stream file downloads without loading in memory',
      'Monitor time-to-first-byte improvement',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Memory vs. Streaming',
        content: `When a standard API endpoint returns data, it loads the entire dataset into memory, serializes it to a single massive JSON string, and then transmits it. If multiple users request a 100MB export simultaneously, your FastAPI workers will rapidly consume gigabytes of RAM, triggering Out-Of-Memory (OOM) kills.

Response streaming solves this by yielding data in small chunks. As the database yields a row, or as a file yields a block of bytes, FastAPI immediately transmits it over the network to the client. The memory footprint remains flat and minimal, regardless of whether the file is 10MB or 10GB.

Additionally, streaming drastically improves "Time to First Byte" (TTFB), as the client begins receiving data almost instantly rather than waiting for the entire dataset to process.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Streaming Database Results',
        content: `To stream database results, we use an asynchronous generator and FastAPI's \`StreamingResponse\`. We also manually construct JSON or CSV lines since we bypass standard Pydantic serialization for the entire collection.`,
        codeExample: {
          id: 'db-streaming',
          language: 'python',
          title: 'Async Server-Sent Events / NDJSON Streaming',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies import get_db
from app.models import LogEntry
import json

app = FastAPI()

async def generate_log_lines(session: AsyncSession):
    """Async generator yielding NDJSON (Newline Delimited JSON)"""
    # Use yield_per to stream results from DB in batches of 1000
    stmt = select(LogEntry).execution_options(yield_per=1000)
    result = await session.stream(stmt)
    
    # stream_scalars iterates over chunks without loading all to memory
    async for log in result.scalars():
        # Manually serialize and yield with a newline
        data = {"id": log.id, "message": log.message, "timestamp": log.timestamp.isoformat()}
        yield json.dumps(data) + "\\n"

@app.get("/logs/export")
async def export_logs(session: AsyncSession = Depends(get_db)):
    # Return immediately, the generator executes continuously while sending data
    return StreamingResponse(
        generate_log_lines(session), 
        media_type="application/x-ndjson"
    )`
            }
          }
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Streaming Files',
        content: `FastAPI also provides \`FileResponse\`, which is highly optimized for static files on disk. Under the hood, \`FileResponse\` uses efficient zero-copy techniques (like \`sendfile\`) managed by the OS, making it significantly faster and less memory-intensive than reading the file manually in Python and yielding it.

Only use \`StreamingResponse\` with manual file yielding if you need to process or modify the bytes on the fly (e.g., streaming encryption or zipping dynamically). For static assets, always use \`FileResponse\`.`
      }
    ],
    challenges: [
      {
        id: 'ch-9',
        title: 'Dynamic CSV Export',
        description: 'Modify the generator to yield CSV formatted strings instead of NDJSON, including a header row as the very first yield.',
        hint: 'Yield the header first, then yield comma-separated strings inside the async loop.',
        solution: 'Yield a header string, then loop through DB records formatting them as CSV.',
        solutionCode: {
          id: 'sol-9',
          language: 'python',
          title: 'CSV Streaming',
          filename: 'main.py',
          code: `async def generate_csv(session: AsyncSession):
    # Yield header
    yield "id,message,timestamp\\n"
    
    stmt = select(LogEntry).execution_options(yield_per=1000)
    result = await session.stream(stmt)
    
    async for log in result.scalars():
        # Basic CSV escaping should be handled in production, simplified here
        yield f"{log.id},{log.message},{log.timestamp}\\n"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-9',
        question: 'What happens to the database connection if a client abruptly disconnects during a `StreamingResponse`?',
        answer: 'FastAPI detects the client disconnection and raises a `ClientDisconnect` exception within the generator. This cancels the generator, allowing any context managers (like `async with session`) to execute their teardown logic, thereby safely closing and returning the database connection to the pool.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-9',
        severity: 'warning',
        content: 'When streaming data behind reverse proxies like Nginx, ensure buffering is disabled (`proxy_buffering off;`). Otherwise, Nginx will buffer the entire stream in memory/disk before sending it to the client, defeating the purpose of streaming.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-9',
        scenario: 'The OOM Export',
        problem: 'A "Download All Transactions" endpoint worked in staging but caused rolling restarts in production due to OOM errors. Staging had 1,000 records; production had 2 million.',
        solution: 'The original code fetched all records via `session.query().all()`, converted them to a list of Pydantic models, and returned a massive JSON array. Refactoring the endpoint to use `session.stream()`, `yield_per()`, and `StreamingResponse` reduced memory usage from 2GB per request to 15MB, eliminating the crashes.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-9',
        title: 'Fake Streaming',
        description: 'Loading all data into memory and THEN yielding it in a generator provides zero memory benefit.',
        badCode: {
          id: 'bad-9',
          language: 'python',
          title: '❌ Buffered Generator',
          code: `async def fake_stream():
    # DANGER: Loads everything into RAM anyway!
    records = await session.execute(select(Model)).scalars().all()
    for row in records:
        yield json.dumps(row.dict()) + "\\n"`
        },
        goodCode: {
          id: 'good-9',
          language: 'python',
          title: '✅ True Streaming',
          code: `async def true_stream():
    # DB driver yields rows incrementally
    result = await session.stream(select(Model).execution_options(yield_per=100))
    async for row in result.scalars():
        yield json.dumps(row.dict()) + "\\n"`
        }
      }
    ],
    codeExamples: [],
  },
  'caching-for-performance': {
    id: '15-10',
    slug: 'caching-for-performance',
    chapterId: 15,
    order: 10,
    title: 'Caching as a Performance Tool',
    description: 'Implement distributed caching with Redis to reduce DB load and drop response times to sub-millisecond levels.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['15-05'],
    objectives: [
      'Identify highest-impact endpoints to cache',
      'Measure cache hit ratio improvement',
      'Calculate latency reduction from cache',
      'Monitor cache effectiveness over time',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Caching Philosophy',
        content: `The fastest database query is the one you never make. Caching is the practice of temporarily storing the results of expensive operations (DB queries, external API calls, CPU-heavy renders) in ultra-fast, in-memory datastores like Redis.

Not all data should be cached. Highly volatile data (financial balances) or user-specific sensitive data requires careful invalidation strategies. The highest ROI comes from caching read-heavy, write-rare data accessed by many users—like product catalogs, configuration settings, or public leaderboards.

When implementing caching, the "Cache Aside" pattern is most common: the application first checks Redis. If the data is there (Cache Hit), it returns it immediately. If not (Cache Miss), it fetches from the Database, stores the result in Redis with a Time-To-Live (TTL), and then returns it.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing Redis Caching',
        content: `We can use ` + "`redis.asyncio`" + ` to interact with Redis asynchronously. To make caching reusable across FastAPI endpoints, we can create a powerful caching decorator.`,
        codeExample: {
          id: 'redis-cache',
          language: 'python',
          title: 'Reusable Cache Decorator',
          files: {
            'app/cache.py': {
              language: 'python',
              code: `import functools
import json
import logging
from typing import Callable, Any
from fastapi import Request
import redis.asyncio as redis

logger = logging.getLogger("cache")
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

def cache_response(ttl: int = 60):
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Try to extract request from kwargs to build cache key
            request: Request = kwargs.get("request")
            if not request:
                return await func(*args, **kwargs)
                
            cache_key = f"cache:{request.url.path}?{request.url.query}"
            
            # Check Cache
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                logger.debug(f"Cache HIT for {cache_key}")
                return json.loads(cached_data)
                
            # Cache Miss - Execute function
            logger.debug(f"Cache MISS for {cache_key}")
            response_data = await func(*args, **kwargs)
            
            # Store in Cache
            # Assumes response_data is a dict/list that can be JSON serialized
            await redis_client.setex(cache_key, ttl, json.dumps(response_data))
            
            return response_data
        return wrapper
    return decorator`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Request, Depends
from app.cache import cache_response
import asyncio

app = FastAPI()

@app.get("/catalog/products")
@cache_response(ttl=300) # Cache for 5 minutes
async def get_products(request: Request, category: str = "all"):
    # Simulate slow DB query
    await asyncio.sleep(2)
    return [
        {"id": 1, "name": "Laptop", "category": category},
        {"id": 2, "name": "Mouse", "category": category}
    ]`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Cache Stampede Prevention',
        content: `A "Cache Stampede" occurs when a highly popular cached item expires (TTL reaches zero). Suddenly, thousands of concurrent requests miss the cache simultaneously and hit the database at the exact same moment, potentially bringing down the database.

Solutions include:
1. **Locking**: When a cache miss occurs, the first process acquires a distributed Redis lock, fetches the data, and updates the cache. Other processes wait a few milliseconds and retry the cache.
2. **Probabilistic Early Expiration**: Processes randomly decide to refresh the cache *before* the TTL expires based on a probability curve.
3. **Background Refresh**: A Celery cron job refreshes the cache asynchronously; API endpoints only ever read from the cache and never hit the DB directly.`
      }
    ],
    challenges: [
      {
        id: 'ch-10',
        title: 'Manual Invalidation',
        description: 'Write an endpoint `DELETE /cache/products` that flushes the cache key for the products catalog.',
        hint: 'Use `await redis_client.delete(key)`.',
        solution: 'Execute a delete command on the specific cache key pattern.',
        solutionCode: {
          id: 'sol-10',
          language: 'python',
          title: 'Cache Invalidation',
          filename: 'main.py',
          code: `@app.delete("/admin/cache/products")
async def clear_product_cache():
    # In a real app, you might use SCAN to find all variations of the query params
    # Or keep a specific deterministic key for the base endpoint
    await redis_client.delete("cache:/catalog/products?category=all")
    return {"status": "cleared"}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-10',
        question: 'What is the "Thundering Herd" or "Cache Stampede" problem, and how do you mitigate it?',
        answer: 'It happens when a highly requested cache key expires, causing all concurrent requests to simultaneously hit the database to recompute the value. Mitigation strategies include implementing distributed locks (mutex) so only one worker queries the DB while others wait, or using background workers to refresh the cache asynchronously before the TTL expires.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10',
        severity: 'critical',
        content: 'Never use indiscriminate `FLUSHALL` commands in production Redis to invalidate cache. It blocks the Redis thread and deletes everything, including rate limits or background task queues if they share the same Redis instance.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-10',
        scenario: 'The Uncachable User Object',
        problem: 'A developer cached the `/users/me` endpoint. User A requested their profile and it was cached. User B then requested their profile, hit the cache, and was served User A\'s personal data.',
        solution: 'The cache key was based entirely on the URL path (`/users/me`), not the authorization context. Cache keys for authenticated endpoints must ALWAYS include a user identifier (like `user_id` extracted from the JWT token), e.g., `cache:/users/me:usr_123`.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-10',
        title: 'Caching Pydantic Models directly',
        description: 'Redis only stores bytes/strings. Attempting to pass raw ORM objects or Pydantic models directly to Redis will crash.',
        badCode: {
          id: 'bad-10',
          language: 'python',
          title: '❌ Storing Objects',
          code: `user = User(id=1, name="Alice")
# Fails: redis cannot serialize python objects
await redis.set("user:1", user)`
        },
        goodCode: {
          id: 'good-10',
          language: 'python',
          title: '✅ Storing JSON',
          code: `user = User(id=1, name="Alice")
# Succeeds: storing a JSON string
await redis.set("user:1", user.model_dump_json())`
        }
      }
    ],
    codeExamples: [],
  },
  'uvicorn-gunicorn-tuning': {
    id: '15-11',
    slug: 'uvicorn-gunicorn-tuning',
    chapterId: 15,
    order: 11,
    title: 'Uvicorn & Gunicorn Tuning',
    description: 'Configure worker counts, timeouts, and network settings for production resilience.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['15-08'],
    objectives: [
      'Calculate optimal worker count (2*CPU+1)',
      'Configure keep-alive for persistent connections',
      'Set appropriate timeouts per endpoint type',
      'Monitor worker memory usage and restart policies',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Process Manager Architecture',
        content: `Uvicorn is a lightning-fast ASGI server, but running Uvicorn directly (` + "`uvicorn main:app`" + `) in production runs only a single process. It cannot utilize multi-core CPUs effectively and cannot automatically restart if the process crashes.

To achieve production resilience, we use Gunicorn as a process manager. Gunicorn oversees a pool of worker processes. By using the \`uvicorn.workers.UvicornWorker\` class, Gunicorn instructs each of its worker processes to run the Uvicorn ASGI server. If a worker consumes too much memory or crashes, Gunicorn gracefully kills it and spawns a fresh one.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Gunicorn Configuration',
        content: `A well-tuned \`gunicorn.conf.py\` is crucial for maximizing throughput while protecting against memory leaks and slow clients.`,
        codeExample: {
          id: 'gunicorn-conf',
          language: 'python',
          title: 'Production gunicorn.conf.py',
          filename: 'gunicorn.conf.py',
          code: `import multiprocessing

# The ASGI application to run
wsgi_app = "app.main:app"

# Use the Uvicorn worker class for async compatibility
worker_class = "uvicorn.workers.UvicornWorker"

# Formula: (2 x $num_cores) + 1
# This ensures that even if some workers are blocked on CPU tasks,
# others are available to accept incoming network connections.
cores = multiprocessing.cpu_count()
workers = max(2, (cores * 2) + 1)

# Bind to all interfaces on port 8000
bind = "0.0.0.0:8000"

# Time before killing a worker that hasn't responded.
# Keep this relatively short (e.g., 30s) to kill blocked async loops,
# but long enough to accommodate your slowest DB query.
timeout = 30

# Protect against memory leaks: restart worker after handling this many requests
max_requests = 10000
# Add jitter to prevent all workers from restarting at the exact same time
max_requests_jitter = 1000

# Keep-alive timeout for persistent HTTP connections
keepalive = 5

# Security limit: max size of HTTP headers
limit_request_line = 4094
limit_request_fields = 100`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Worker Count in Containerized Environments',
        content: `When deploying to Kubernetes or Docker, the ` + "`multiprocessing.cpu_count()`" + ` function can be deceptive. It returns the number of physical cores on the host node, NOT the CPU limit assigned to the container (unless you use specific cgroup parsing).

If a pod has a limit of ` + "`0.5`" + ` CPU, but the host node has 16 cores, dynamic calculation will spawn 33 workers. These 33 workers will fiercely compete for the 0.5 CPU slice, resulting in massive context-switching overhead and terrible performance. 

In containerized environments, it is often better to explicitly set the worker count via environment variables (` + "`WORKERS=2`" + `) based on the pod's specific resource limits.`
      }
    ],
    challenges: [
      {
        id: 'ch-11',
        title: 'Container-Aware Startup',
        description: 'Write a shell command to start Gunicorn reading the worker count from an environment variable `WEB_CONCURRENCY`, defaulting to 2 if not set.',
        hint: 'Bash variable expansion `${VAR:-default}` is useful here.',
        solution: 'Pass the variable directly to the `-w` flag.',
        solutionCode: {
          id: 'sol-11',
          language: 'bash',
          title: 'Docker CMD',
          filename: 'Dockerfile',
          code: `CMD ["sh", "-c", "gunicorn app.main:app -w \${WEB_CONCURRENCY:-2} -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000"]`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-11',
        question: 'Why do we set `max_requests` in Gunicorn, and why is `max_requests_jitter` important?',
        answer: '`max_requests` instructs Gunicorn to restart a worker process after it has served a certain number of requests. This is a pragmatic defense against slow memory leaks in Python dependencies or the application itself. `max_requests_jitter` adds a random variance to this limit. Without jitter, if all workers start simultaneously, they will hit the `max_requests` limit simultaneously, causing all workers to restart at once and dropping incoming traffic.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-11',
        severity: 'critical',
        content: 'If you have endpoints handling long-running operations like file uploads or websockets, ensure your Load Balancer (Nginx/ALB) and Gunicorn `timeout` settings are aligned, or requests will be mysteriously severed midway.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-11',
        scenario: 'The 32-Core Catastrophe',
        problem: 'A team moved their FastAPI docker container to a massive 32-core AWS instance without resource limits. Response times increased by 500% compared to the older 4-core instance.',
        solution: 'The startup script was using `(cores * 2) + 1`, spawning 65 worker processes. Each process initialized a DB connection pool of 20, immediately exhausting the database limit of 500 connections. Requests were timing out waiting for connections. The team hardcoded workers to `4` and deployed multiple scaled pods instead of one monolithic instance.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-11',
        title: 'Running Uvicorn Directly in Prod',
        description: 'Running uvicorn directly lacks process management. If the app crashes (e.g., Segfault from a C-extension), the container dies.',
        badCode: {
          id: 'bad-11',
          language: 'bash',
          title: '❌ Dev Server in Prod',
          code: `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
        },
        goodCode: {
          id: 'good-11',
          language: 'bash',
          title: '✅ Process Manager',
          code: `CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-c", "gunicorn.conf.py"]`
        }
      }
    ],
    codeExamples: [],
  },
  'performance-budget': {
    id: '15-12',
    slug: 'performance-budget',
    chapterId: 15,
    order: 12,
    title: 'Performance Budgets & SLOs',
    description: 'Establish operational criteria for performance, set up Prometheus alerting, and enforce budgets in CI/CD.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.prometheus],
    prerequisites: ['15-11'],
    objectives: [
      'Define latency SLOs for each endpoint',
      'Add performance assertions to tests',
      'Alert on SLO violations in production',
      'Use error budgets to balance features vs reliability',
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Engineering for Reliability',
        content: `Performance is a feature, and like any feature, it regresses over time as new code is added unless explicitly guarded. A Service Level Objective (SLO) is a quantifiable target for reliability and performance. For example: "99% of GET /items requests must complete within 200ms."

If an endpoint consistently fails to meet its SLO, you consume your "Error Budget." In strict engineering cultures, when the error budget is depleted, all feature development halts, and the team must focus entirely on performance optimization and reliability engineering. 

To enforce this, you must measure latency accurately in production using tools like Prometheus, and enforce limits during CI/CD using performance testing frameworks.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Prometheus Metrics Integration',
        content: `To measure SLOs, we expose a \`/metrics\` endpoint using \`prometheus_client\`. We track request latency using a Histogram, which allows Prometheus to calculate percentiles (P95, P99) mathematically.`,
        codeExample: {
          id: 'prom-metrics',
          language: 'python',
          title: 'Latency Histogram Middleware',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from prometheus_client import make_asgi_app, Histogram
import time

app = FastAPI()

# Define a Histogram to track latency. 
# Buckets represent latency thresholds in seconds.
REQUEST_LATENCY = Histogram(
    "fastapi_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)

class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.monotonic()
        
        # We group endpoints by their generic path (e.g. /users/{id}) 
        # to avoid cardinality explosion in Prometheus.
        endpoint_path = request.scope.get("route", {}).get("path", request.url.path)
        
        response = await call_next(request)
        
        duration = time.monotonic() - start_time
        REQUEST_LATENCY.labels(
            method=request.method, 
            endpoint=endpoint_path
        ).observe(duration)
        
        return response

app.add_middleware(PrometheusMiddleware)

# Expose metrics for Prometheus scraper
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)`
            }
          }
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Setting PromQL Alerts',
        content: `Once data is flowing into Prometheus, you write queries to alert on SLO violations. For the SLO: "99% of requests < 500ms", we use the ` + "`histogram_quantile`" + ` function.

A PromQL alert rule looks like this:
` + "```promql\n" + `
- alert: HighLatency_P99
  expr: histogram_quantile(0.99, rate(fastapi_request_duration_seconds_bucket[5m])) > 0.5
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "API Latency P99 is above 500ms"
` + "```\n" + `
This alerts the team via PagerDuty/Slack if the 99th percentile latency exceeds 0.5 seconds for more than 5 consecutive minutes.`
      }
    ],
    challenges: [
      {
        id: 'ch-12',
        title: 'CI/CD Performance Assertion',
        description: 'Imagine you use pytest-benchmark. Write a small test that asserts a specific synchronous function `calculate_hash` completes in under 0.01 seconds.',
        hint: 'Use the `benchmark` fixture provided by `pytest-benchmark`.',
        solution: 'Use `benchmark(func)` and assert its stats.',
        solutionCode: {
          id: 'sol-12',
          language: 'python',
          title: 'Pytest Benchmark',
          filename: 'test_perf.py',
          code: `def calculate_hash():
    import hashlib
    return hashlib.sha256(b"hello world" * 1000).hexdigest()

def test_hash_performance(benchmark):
    # Run the function multiple times to gather stats
    result = benchmark(calculate_hash)
    
    # Assert the mean execution time is under 10 milliseconds
    assert benchmark.stats.stats.mean < 0.01`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-12',
        question: 'What is cardinality explosion in Prometheus, and how does it relate to FastAPI routing?',
        answer: 'Cardinality refers to the number of unique label combinations in metrics. If you label a metric with the raw request path (e.g., `/users/123`, `/users/456`), Prometheus creates a separate time series for every single user ID. This consumes massive amounts of memory and will crash the Prometheus server (Cardinality Explosion). You must always label metrics with the parameterized route template (`/users/{id}`) instead of the raw path.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-12',
        severity: 'info',
        content: 'When defining SLOs, tie them to business value. A 50ms SLO on an internal reporting endpoint is wasteful; a 50ms SLO on the e-commerce checkout button is critical.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-12',
        scenario: 'The Frog Boiling Problem',
        problem: 'Over 6 months, an API endpoint went from taking 100ms to 800ms. Because the degradation was gradual (5ms slower each week), no one noticed until customers started churning.',
        solution: 'The team lacked objective performance budgets. They implemented Prometheus latency alerts and a Locust step in their Jenkins pipeline that failed the build if P95 latency dropped below baseline. This enforced performance regressions to be fixed at PR review time, not months later in production.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-12',
        title: 'Ignoring the Payload',
        description: 'Tracking only the `call_next(request)` time in middleware misses the time FastAPI spends streaming the response body back to the client.',
        badCode: {
          id: 'bad-12',
          language: 'python',
          title: '❌ Missing Body Time',
          code: `response = await call_next(request)
# If the client has a slow connection, response streaming takes longer, 
# but this timer stops before the body is sent!
observe_time(start - end)`
        },
        goodCode: {
          id: 'good-12',
          language: 'python',
          title: '✅ Framework Logging',
          code: `# For accurate edge-latency, rely on the ASGI server (Uvicorn) logs 
# or an API Gateway (Nginx/ALB) which tracks TTFB and total transmission time.`
        }
      }
    ],
    codeExamples: [],
  }
};
