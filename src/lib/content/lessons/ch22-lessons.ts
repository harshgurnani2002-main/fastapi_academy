import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch22Lessons: Record<string, Lesson> = {
  'cap-theorem': {
    id: '22-01',
    slug: 'cap-theorem',
    chapterId: 22,
    order: 1,
    title: 'CAP Theorem in Practice',
    description: 'Apply the CAP theorem to real-world distributed systems and understand PACELC.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.postgresql, technologies.redis],
    prerequisites: [],
    objectives: [
      'Apply CAP theorem to your specific use case',
      'Understand PACELC as a refinement',
      'Classify PostgreSQL, Redis, and Cassandra by CAP',
      'Design for partition tolerance explicitly'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'CAP and PACELC Explained',
        content: `The CAP theorem states that a distributed data store can provide at most two of the following three guarantees: Consistency (C), Availability (A), and Partition Tolerance (P). In reality, networks fail, so partitions will happen (P is a given). Thus, the real choice is between Consistency and Availability during a partition.
        
PACELC extends this: in case of a Partition (P), you choose between Availability (A) and Consistency (C), Else (E) (when the system is running normally), you choose between Latency (L) and Consistency (C). Understanding this framework is crucial for choosing the right database and replication strategy.`,
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Real-World Database Classification',
        content: `PostgreSQL with asynchronous replication is AP (or PA/EL). It favors availability during a partition but trades some consistency (staleness) for lower latency in normal operation.
        
Redis (single node) is CP. Redis Cluster with asynchronous replication is AP. Cassandra is highly tunable but typically deployed as AP. Understanding these defaults prevents catastrophic failures in production when network partitions occur.`,
      },
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Assuming CP is always better',
        description: 'Developers often demand strong consistency when eventual consistency (AP) would suffice, resulting in fragile systems that go down during minor network blips.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: '❌ Over-synchronized',
          code: `# Fails if ANY replica is down
await db.execute("INSERT INTO users...", sync_replicas=ALL)`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: '✅ AP approach',
          code: `# Eventual consistency
await db.execute("INSERT INTO users...")
# Background replication handles the rest`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Design an AP system',
        description: 'Explain how you would handle user profile updates in an AP system during a network partition.',
        hint: 'Think about conflict resolution.',
        solution: 'Use last-write-wins (LWW) with timestamps, or CRDTs for complex data structures like sets or counters, allowing both sides of the partition to accept writes and merge them later.',
        solutionCode: {
          id: 'sc-1',
          language: 'python',
          title: 'LWW Conflict Resolution',
          filename: 'resolution.py',
          code: `def resolve_conflict(local_record, remote_record):
    if local_record.updated_at > remote_record.updated_at:
        return local_record
    return remote_record`
        }
      }
    ],
    codeExamples: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'consistency-models': {
    id: '22-02',
    slug: 'consistency-models',
    chapterId: 22,
    order: 2,
    title: 'Consistency Models',
    description: 'Explore different consistency models and their implications on application logic.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.postgresql, technologies.redis],
    prerequisites: ['22-01'],
    objectives: [
      'Distinguish linearizability from serializability',
      'Understand read-your-own-writes consistency',
      'Choose the weakest consistency model you can tolerate',
      'Implement causal consistency in distributed systems'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Understanding Consistency',
        content: `Consistency models dictate the rules of how and when updates become visible to readers in a distributed system. Strong consistency (Linearizability) guarantees that once a write completes, all subsequent reads will reflect that write.
        
However, strong consistency implies high latency and reduced availability. Weaker models like Eventual Consistency, Causal Consistency, and Read-Your-Own-Writes provide better performance but require the application to handle stale data.`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Implementing Read-Your-Own-Writes',
        content: `A common pattern to hide eventual consistency from users is 'Read-Your-Own-Writes'. If a user updates their profile, their next read should hit the master database or pass a version token to ensure they see their update, while other users might temporarily see the old version.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Read-Your-Own-Writes Pattern',
          filename: 'services.py',
          code: `from fastapi import Request

async def get_user_profile(user_id: int, request: Request, db_pools: dict):
    # Check if this user recently wrote data
    recently_written = await cache.get(f"recent_write:{user_id}")
    
    if recently_written:
        # Route to primary/master database
        db = db_pools['primary']
    else:
        # Route to read replica
        db = db_pools['replica']
        
    return await db.fetch_row("SELECT * FROM users WHERE id = $1", user_id)

async def update_user_profile(user_id: int, data: dict, db_pools: dict):
    db = db_pools['primary']
    await db.execute("UPDATE users SET ...", data)
    
    # Mark that this user recently wrote (e.g., valid for 5 seconds)
    await cache.set(f"recent_write:{user_id}", "1", ex=5)`
        }
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never use Read-Your-Own-Writes for critical financial transactions; use strong consistency (serializable isolation) instead.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'distributed-locks': {
    id: '22-03',
    slug: 'distributed-locks',
    chapterId: 22,
    order: 3,
    title: 'Distributed Locking at Scale',
    description: 'Safely coordinate access to shared resources across multiple service instances.',
    duration: 55,
    difficulty: 'production',
    technologies: [technologies.redis, technologies.postgresql],
    prerequisites: ['22-01'],
    objectives: [
      'Implement correct Redis distributed lock',
      'Understand Redlock algorithm and its limitations',
      'Use PostgreSQL advisory locks as lock service',
      'Test distributed lock correctness under failure'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Need for Distributed Locks',
        content: `When multiple instances of a FastAPI application need exclusive access to a shared resource (like a specific database record, an external API, or a file), standard threading locks (like \`asyncio.Lock\`) are insufficient because they only work within a single process.
        
Distributed locks use a central store like Redis or PostgreSQL to coordinate access. However, distributed locks are notoriously difficult to implement correctly due to network delays, garbage collection pauses, and clock drift.`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Redis Distributed Lock Implementation',
        content: `A robust Redis lock requires: 1) setting a unique value with an expiration (NX PX), and 2) a Lua script to release the lock only if the value matches (preventing instance A from releasing instance B's lock if A experienced a long pause).`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Correct Redis Lock',
          filename: 'locks.py',
          code: `import uuid
import asyncio
from contextlib import asynccontextmanager

RELEASE_LUA = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""

@asynccontextmanager
async def redis_lock(redis_client, lock_name: str, timeout_ms: int = 5000):
    identifier = str(uuid.uuid4())
    lock_key = f"lock:{lock_name}"
    
    # Acquire
    acquired = await redis_client.set(
        lock_key, identifier, px=timeout_ms, nx=True
    )
    
    if not acquired:
        raise Exception("Could not acquire lock")
        
    try:
        yield
    finally:
        # Release safely using Lua
        await redis_client.eval(RELEASE_LUA, 1, lock_key, identifier)`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The GC Pause Disaster',
        problem: 'Service A acquired a lock for 5s, suffered a 6s garbage collection pause, and proceeded to write data. Meanwhile, the lock expired, Service B acquired it, and also wrote data. Data corruption ensued.',
        solution: 'Implemented fencing tokens (monotonic sequence numbers passed to the underlying storage) to reject writes from instances whose locks had expired.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'circuit-breaker-pattern': {
    id: '22-04',
    slug: 'circuit-breaker-pattern',
    chapterId: 22,
    order: 4,
    title: 'Circuit Breaker Pattern',
    description: 'Prevent cascading failures by failing fast when downstream services degrade.',
    duration: 55,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.redis, technologies.python],
    prerequisites: [],
    objectives: [
      'Implement three-state circuit breaker (closed/open/half-open)',
      'Configure failure thresholds and recovery timeouts',
      'Monitor circuit breaker state with metrics',
      'Test circuit breaker behavior with chaos engineering'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Protecting Systems with Circuit Breakers',
        content: `In a distributed system, a slow downstream service is often worse than a dead one. If Service A calls Service B, and Service B starts taking 30 seconds to respond, Service A will exhaust all its worker threads waiting, causing Service A to also fail. This is a cascading failure.
        
A Circuit Breaker monitors failures (timeouts, 500s). If failures exceed a threshold, it 'opens', immediately rejecting calls to the downstream service without actually making them. After a timeout, it goes 'half-open', allowing a few test requests. If they succeed, it 'closes' (resumes normal operation).`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Implementing a Circuit Breaker in FastAPI',
        content: `Here is a production-grade implementation of a circuit breaker managing state in Redis to share state across multiple FastAPI worker processes.`,
      }
    ],
    codeExamples: [
      {
        id: 'ce-2',
        title: 'Circuit Breaker implementation',
        files: {
          'resilience/circuit_breaker.py': {
            language: 'python',
            code: `import time
from enum import Enum
from functools import wraps

class State(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(
        self, redis, name: str, 
        failure_threshold: int = 5,
        recovery_timeout: int = 30
    ):
        self.redis = redis
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.key_failures = f"cb:{name}:failures"
        self.key_state = f"cb:{name}:state"
        self.key_half_open = f"cb:{name}:half_open_test"

    async def get_state(self):
        state = await self.redis.get(self.key_state)
        if not state:
            return State.CLOSED
        return State(state.decode())

    async def record_failure(self):
        failures = await self.redis.incr(self.key_failures)
        if failures >= self.failure_threshold:
            # Open the circuit, setting TTL for recovery timeout
            await self.redis.set(self.key_state, State.OPEN.value, ex=self.recovery_timeout)
            
    async def record_success(self):
        await self.redis.delete(self.key_failures)
        await self.redis.set(self.key_state, State.CLOSED.value)

    async def call(self, func, *args, **kwargs):
        state = await self.get_state()
        
        if state == State.OPEN:
            raise Exception(f"Circuit {self.name} is OPEN")
            
        if state == State.HALF_OPEN:
            # Only allow one concurrent test request
            if not await self.redis.set(self.key_half_open, "1", nx=True, ex=5):
                raise Exception(f"Circuit {self.name} is HALF_OPEN, test in progress")

        try:
            result = await func(*args, **kwargs)
            if state == State.HALF_OPEN:
                await self.record_success()
                await self.redis.delete(self.key_half_open)
            return result
        except Exception as e:
            await self.record_failure()
            if state == State.HALF_OPEN:
                await self.redis.delete(self.key_half_open)
            raise e`
          },
          'app/main.py': {
            language: 'python',
            code: `from fastapi import FastAPI, Depends
from resilience.circuit_breaker import CircuitBreaker
import httpx

app = FastAPI()
# Assume redis_pool is initialized
cb = CircuitBreaker(redis_pool, "payment_service")

async def call_payment_api():
    async with httpx.AsyncClient() as client:
        return await client.post("http://payment/charge")

@app.post("/checkout")
async def checkout():
    try:
        # Wrap the fragile network call
        result = await cb.call(call_payment_api)
        return {"status": "success"}
    except Exception as e:
        return {"error": "Payment service unavailable", "fallback": True}`
          }
        }
      }
    ],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'bulkhead-pattern': {
    id: '22-05',
    slug: 'bulkhead-pattern',
    chapterId: 22,
    order: 5,
    title: 'Bulkhead Pattern',
    description: 'Isolate failures to prevent a single component from taking down the entire system.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Implement separate connection pools per service',
      'Use semaphores for bulkhead limiting',
      'Prevent a slow service from starving others',
      'Size bulkheads based on SLA requirements'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Ship Design Meets Distributed Systems',
        content: `A ship is divided into multiple watertight compartments called bulkheads. If the hull is breached, only one compartment floods, saving the ship.
        
In software, a bulkhead isolates resources (like thread pools, connection pools, or concurrency limits) so that if one downstream dependency slows down, it only exhausts its dedicated pool, leaving the rest of the application healthy to serve other requests.`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Concurrency Limits via Semaphores',
        content: `In asynchronous Python, we can implement bulkheads using \`asyncio.Semaphore\`. This limits how many concurrent requests are allowed to hit a specific service.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Bulkhead Implementation',
          filename: 'bulkhead.py',
          code: `import asyncio
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Max 10 concurrent calls to the slow reporting service
reporting_bulkhead = asyncio.Semaphore(10)
# Max 50 concurrent calls to the fast user service
user_bulkhead = asyncio.Semaphore(50)

@app.get("/report")
async def generate_report():
    if reporting_bulkhead.locked():
        # Reject immediately if bulkhead is full
        raise HTTPException(status_code=429, detail="Reporting service too busy")
        
    async with reporting_bulkhead:
        # Simulate slow downstream call
        await asyncio.sleep(2)
        return {"data": "report"}`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Shared Connection Pools',
        description: 'Using a single global httpx.AsyncClient or database pool for all outgoing calls defeats the bulkhead pattern.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: '❌ Shared Client',
          code: `client = httpx.AsyncClient(limits=httpx.Limits(max_connections=100))
# A slow /payment endpoint will consume all 100 connections
await client.get("/payment")
await client.get("/user")`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: '✅ Separate Clients',
          code: `payment_client = httpx.AsyncClient(limits=httpx.Limits(max_connections=20))
user_client = httpx.AsyncClient(limits=httpx.Limits(max_connections=80))`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'retry-patterns': {
    id: '22-06',
    slug: 'retry-patterns',
    chapterId: 22,
    order: 6,
    title: 'Retry Patterns & Idempotent Operations',
    description: 'Safely retry failed operations without causing data corruption or thundering herds.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Implement exponential backoff with jitter',
      'Ensure retried operations are idempotent',
      'Limit total retry time with deadlines',
      'Implement retry budgets to avoid thundering herds'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Danger of Naive Retries',
        content: `Transient errors (brief network drops) are common. Retrying is the standard solution. However, if thousands of clients retry immediately at the exact same time when a service blips, they create a 'thundering herd' that DDoS-es the recovering service.
        
Furthermore, retrying non-idempotent operations (like "charge credit card") can lead to duplicate transactions. Retries must always be accompanied by idempotency keys and exponential backoff with jitter (randomness).`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Exponential Backoff with Jitter',
        content: `Using libraries like \`tenacity\` is highly recommended over writing custom retry loops. It handles backoff, jitter, and exception filtering gracefully.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Tenacity Retry',
          filename: 'retry.py',
          code: `from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import httpx

# Wait 2^x * 1 second between each retry starting with 2 seconds, then 4, up to 10 seconds.
# Adds random jitter automatically.
@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.ReadTimeout, httpx.ConnectError))
)
async def fetch_user_data(user_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"http://api/users/{user_id}", timeout=2.0)
        resp.raise_for_status()
        return resp.json()`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is jitter and why is it essential in retry logic?',
        answer: 'Jitter adds randomness to the retry delay. Without it, if a service fails, all blocked clients will retry at the exact same exponential intervals, creating massive traffic spikes that can knock the service down again.',
        difficulty: 'advanced'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'timeout-strategies': {
    id: '22-07',
    slug: 'timeout-strategies',
    chapterId: 22,
    order: 7,
    title: 'Timeout Strategies',
    description: 'Enforce tight bounds on request latency and propagate deadlines across services.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Set timeouts for every external call',
      'Implement request deadline propagation',
      'Use budget timeouts instead of fixed timeouts',
      'Handle timeout errors gracefully in the caller'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Default Timeout Trap',
        content: `Many HTTP clients (like Python's requests or httpx) have infinite or very high default timeouts. In a distributed system, this means one stalled dependency will cause your service to hang indefinitely. You must set explicit, short timeouts for *every* network call.`,
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Deadline Propagation',
        content: `If a user request has a global timeout of 5 seconds, and your service spends 3 seconds in the DB, the downstream HTTP call should only have a 2-second timeout. This is called 'deadline propagation' or 'budget timeouts'. We pass the remaining time budget down the call stack.`,
      },
      {
        id: 'sec-3',
        type: 'implementation',
        title: 'Implementing Timeouts in FastAPI',
        content: `We can use middleware to track the request start time and calculate the remaining budget for subsequent calls.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Deadline Propagation',
          filename: 'middleware.py',
          code: `import time
from fastapi import Request

# In middleware:
# request.state.deadline = time.time() + 5.0 # Global 5s deadline

async def call_external_service(request: Request):
    # Calculate remaining budget
    remaining_time = request.state.deadline - time.time()
    
    if remaining_time <= 0:
        raise TimeoutError("Global request deadline exceeded")
        
    async with httpx.AsyncClient() as client:
        # Use the remaining time as the timeout
        return await client.get(
            "http://external/api", 
            timeout=remaining_time
        )`
        }
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Always configure both connection timeouts (TCP handshake) and read timeouts (time to first byte / read completion). Connection timeouts should usually be very short (e.g., 1-2 seconds).'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'backpressure': {
    id: '22-08',
    slug: 'backpressure',
    chapterId: 22,
    order: 8,
    title: 'Backpressure Handling',
    description: 'Gracefully handle traffic spikes by pushing back on the producer rather than crashing.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.celery, technologies.redis],
    prerequisites: [],
    objectives: [
      'Detect backpressure with queue depth metrics',
      'Implement load shedding under overload',
      'Use bounded queues to force backpressure',
      'Propagate backpressure signals upstream'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Need for Backpressure',
        content: `When a producer generates data faster than a consumer can process it, queues build up. If queues are unbounded, memory exhausts and the system crashes. Backpressure is the mechanism of signaling the producer to slow down or outright rejecting new work (load shedding) to protect system stability.`,
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Load Shedding Strategies',
        content: `Load shedding intentionally drops requests when overloaded. It's better to serve 90% of requests successfully than 100% of requests with a 30-second latency (which clients treat as failures anyway). We can shed load based on CPU usage, queue depth, or active concurrent requests.`,
      },
      {
        id: 'sec-3',
        type: 'implementation',
        title: 'Bounded Queues in Celery',
        content: `When using message queues, always enforce a maximum queue size. If the queue is full, the producer should fail fast.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Bounded Queue Check',
          filename: 'tasks.py',
          code: `import redis
from fastapi import HTTPException

redis_client = redis.Redis()
MAX_QUEUE_SIZE = 10000

def enqueue_job(data):
    # Check queue length before pushing
    current_size = redis_client.llen("celery")
    
    if current_size >= MAX_QUEUE_SIZE:
        # Load shed! Return 429 Too Many Requests
        raise HTTPException(
            status_code=429, 
            detail="System overloaded. Please try again later."
        )
        
    # Queue is healthy, dispatch task
    my_celery_task.delay(data)`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'failure-simulation': {
    id: '22-09',
    slug: 'failure-simulation',
    chapterId: 22,
    order: 9,
    title: 'Failure Simulation & Chaos Engineering',
    description: 'Proactively inject failures to validate system resilience mechanisms.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.kubernetes, technologies.fastapi],
    prerequisites: ['22-04', '22-06', '22-07'],
    objectives: [
      'Inject network latency with tc netem',
      'Kill pods randomly in Kubernetes',
      'Simulate database connection failures',
      'Document chaos experiments and findings'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Chaos Engineering Basics',
        content: `You cannot be confident in your circuit breakers or timeouts unless you trigger them. Chaos engineering is the discipline of experimenting on a system in order to build confidence in its capability to withstand turbulent conditions. We intentionally introduce network latency, drop packets, or kill processes.`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Injecting Network Chaos',
        content: `Linux 'tc' (traffic control) is standard for injecting network latency. Alternatively, in Kubernetes, tools like Chaos Mesh or Litmus Chaos are heavily used. But you can also implement lightweight application-level chaos in FastAPI using middleware for testing environments.`,
      }
    ],
    codeExamples: [
      {
        id: 'ce-1',
        title: 'App-level Chaos Middleware',
        files: {
          'resilience/chaos.py': {
            language: 'python',
            code: `import os
import random
import asyncio
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class ChaosMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only enable in dev/staging!
        if not os.getenv("ENABLE_CHAOS") == "true":
            return await call_next(request)
            
        chaos_val = random.random()
        
        # 5% chance to drop request
        if chaos_val < 0.05:
            return JSONResponse(status_code=503, content={"error": "Chaos: Service Unavailable"})
            
        # 10% chance to add massive latency
        if chaos_val < 0.15:
            await asyncio.sleep(random.uniform(2.0, 5.0))
            
        return await call_next(request)`
          }
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'How do you perform Chaos Engineering in production safely?',
        answer: 'Start small and limit the blast radius. Use feature flags to route only a small percentage of test traffic (or synthetic traffic) to the chaos experiments. Have automated rollback triggers if error rates breach critical thresholds.',
        difficulty: 'expert'
      }
    ],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'consensus-fundamentals': {
    id: '22-10',
    slug: 'consensus-fundamentals',
    chapterId: 22,
    order: 10,
    title: 'Consensus Fundamentals',
    description: 'Understand how distributed systems agree on state using protocols like Raft.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.kubernetes],
    prerequisites: ['22-01'],
    objectives: [
      'Understand the consensus problem definition',
      'Explain Raft leader election at a high level',
      'Know when you need consensus vs eventual consistency',
      'Use etcd or ZooKeeper when you need consensus'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Consensus Problem',
        content: `Consensus is the process by which a cluster of nodes agrees on a single value or series of values, even in the presence of node failures or network partitions. This is fundamental for leader election, strongly consistent data stores, and distributed locking.
        
Protocols like Paxos and Raft solve this by requiring a quorum (majority) to agree. If you have 5 nodes, 3 must agree. If a partition isolates 2 nodes, they cannot form a quorum and halt writes, preserving consistency.`,
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Raft in Practice',
        content: `You rarely implement consensus yourself. Instead, you rely on systems built on Raft (like etcd, HashiCorp Consul) or ZAB (ZooKeeper). For example, Kubernetes uses etcd to store cluster state securely. When building distributed systems in Python, if you need strict agreement (e.g., who is the master worker), you connect to etcd or ZooKeeper rather than inventing your own algorithm.`,
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'Consensus clusters should always have an odd number of nodes (3, 5, or 7) to prevent split-brain scenarios and optimize quorum requirements.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'distributed-tracing': {
    id: '22-11',
    slug: 'distributed-tracing',
    chapterId: 22,
    order: 11,
    title: 'Distributed Tracing Across Services',
    description: 'Track requests as they propagate across multiple microservices to pinpoint bottlenecks.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.opentelemetry, technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Propagate trace context via HTTP headers',
      'Visualize multi-service traces in Jaeger',
      'Correlate traces with logs and metrics',
      'Identify latency bottlenecks across service calls'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Visibility Gap',
        content: `In a monolith, a stack trace tells you exactly what failed. In a distributed architecture, a request might traverse 5 different microservices. If it takes 4 seconds, you need to know *which* service caused the delay. Distributed tracing solves this by passing a unique Trace ID along with the request.`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'OpenTelemetry in FastAPI',
        content: `OpenTelemetry is the standard for distributed tracing. It automatically instruments FastAPI, HTTPX, and SQLAlchemy to propagate the \`traceparent\` HTTP headers automatically.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'FastAPI OpenTelemetry Setup',
          filename: 'tracing.py',
          code: `from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from fastapi import FastAPI

# Set up tracing provider
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer_provider()
tracer.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))

app = FastAPI()

# Automatically instrument incoming requests and outgoing HTTPX calls
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    # This span automatically attaches to the incoming trace context
    current_span = trace.get_current_span()
    current_span.set_attribute("user.id", user_id)
    return {"status": "ok"}`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Correlate Logs and Traces',
        description: 'How do you ensure your application logs include the current Trace ID?',
        hint: 'You need a logging filter that extracts context from OpenTelemetry.',
        solution: 'Use a custom logging filter or structlog processor that calls `trace.get_current_span().get_span_context().trace_id` and injects it into the log record.',
        solutionCode: {
          id: 'sc-1',
          language: 'python',
          title: 'Log Injection',
          filename: 'logging.py',
          code: `import logging
from opentelemetry import trace

class TraceIdFilter(logging.Filter):
    def filter(self, record):
        span = trace.get_current_span()
        if span.is_recording():
            ctx = span.get_span_context()
            # Convert integer trace_id to hex string
            record.trace_id = format(ctx.trace_id, '032x')
        else:
            record.trace_id = "none"
        return True`
        }
      }
    ],
    codeExamples: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'load-balancing-algorithms': {
    id: '22-12',
    slug: 'load-balancing-algorithms',
    chapterId: 22,
    order: 12,
    title: 'Load Balancing Algorithms Deep Dive',
    description: 'Advanced routing strategies for optimal resource utilization in distributed environments.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.nginx, technologies.kubernetes],
    prerequisites: [],
    objectives: [
      'Implement consistent hashing for stateful routing',
      'Use power-of-two choices for load balancing',
      'Handle sticky sessions in distributed systems',
      'Monitor load distribution evenness'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Beyond Round Robin',
        content: `Round Robin is simple but assumes all requests cost the same and all servers have identical capacity. In reality, this leads to imbalances. Least Connections routing is better, but can still lead to "herd behavior" where all new traffic slams the currently quietest node.`,
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Power of Two Choices',
        content: `A highly effective algorithm used at scale is "Power of Two Choices". Instead of polling *every* backend to find the absolute least loaded (which is slow O(N)), it randomly picks exactly two backends, compares them, and chooses the less loaded one. This O(1) operation mathematically provides a massive improvement over random selection and prevents herds.`,
      },
      {
        id: 'sec-3',
        type: 'implementation',
        title: 'Consistent Hashing',
        content: `When caching is involved, you want requests for 'User A' to always hit 'Server 1' so the cache remains hot. Standard hashing (hash(id) % N) fails catastrophically if N changes (a server dies), remapping everything. Consistent Hashing places nodes on a hash ring, meaning adding/removing a node only shifts a small fraction of keys.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Simple Hash Ring Logic',
          filename: 'hash_ring.py',
          code: `import hashlib
import bisect

class HashRing:
    def __init__(self, nodes, replicas=100):
        self.replicas = replicas
        self.ring = {}
        self.sorted_keys = []
        for node in nodes:
            self.add_node(node)
            
    def _hash(self, key):
        return int(hashlib.md5(key.encode('utf-8')).hexdigest(), 16)
        
    def add_node(self, node):
        for i in range(self.replicas):
            h = self._hash(f"{node}:{i}")
            self.ring[h] = node
            bisect.insort(self.sorted_keys, h)
            
    def get_node(self, key):
        if not self.ring:
            return None
        h = self._hash(key)
        # Find first node on ring after this hash
        idx = bisect.bisect(self.sorted_keys, h)
        if idx == len(self.sorted_keys):
            idx = 0  # wrap around
        return self.ring[self.sorted_keys[idx]]`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'graceful-degradation': {
    id: '22-13',
    slug: 'graceful-degradation',
    chapterId: 22,
    order: 13,
    title: 'Graceful Degradation Design',
    description: 'Design systems to remain partially functional when critical dependencies fail.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.redis],
    prerequisites: ['22-04'],
    objectives: [
      'Identify degradable features vs critical paths',
      'Implement feature flags for emergency shutoff',
      'Serve cached data when backend is down',
      'Communicate degraded status to users'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Failure is Inevitable, Impact is Optional',
        content: `Graceful degradation accepts that downstream services will fail. If the recommendation engine goes down on an e-commerce site, users should still be able to search and checkout. You return a static list of "bestsellers" instead of personalized recommendations, rather than showing a 500 Error.`,
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Stale Cache Fallback',
        content: `A common graceful degradation pattern is serving stale cache. If your primary DB is unreachable, but you have slightly outdated data in Redis, serve it and add a flag indicating it might be stale.`,
        codeExample: {
          id: 'ce-1',
          language: 'python',
          title: 'Stale Cache Fallback',
          filename: 'fallback.py',
          code: `import json
from fastapi import FastAPI, HTTPException

app = FastAPI()

async def get_from_db(item_id):
    # Simulate DB failure
    raise ConnectionError("DB is down")

@app.get("/items/{item_id}")
async def get_item(item_id: str):
    try:
        # 1. Try critical path
        data = await get_from_db(item_id)
        # Update cache on success
        await redis.set(f"item:{item_id}", json.dumps(data), ex=3600)
        return data
    except Exception:
        # 2. Fallback to cache (even if expired/stale logic could be added)
        cached = await redis.get(f"item:{item_id}")
        if cached:
            parsed = json.loads(cached)
            parsed["_meta"] = {"degraded": True, "stale": True}
            return parsed
            
        # 3. Absolute fallback
        raise HTTPException(status_code=503, detail="Service currently unavailable")`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Search Blackout',
        problem: 'An elasticsearch cluster upgrade failed, taking down the entire search API for 2 hours.',
        solution: 'The API Gateway was reconfigured using a feature flag to route search queries to a static JSON file containing the top 100 most searched terms and generic results, allowing critical navigation to continue.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  }
};
