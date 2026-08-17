import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch08CacheStampede: Lesson = {
  id: '08-06',
  slug: 'cache-stampede-protection',
  chapterId: 8,
  order: 6,
  title: 'Cache Stampede Protection',
  description: 'Learn how to detect, understand, and prevent cache stampedes in highly concurrent FastAPI applications using distributed locking.',
  duration: 55,
  difficulty: 'expert',
  technologies: [technologies.fastapi, technologies.redis, technologies.python],
  prerequisites: ['08-01', '08-02'],
  objectives: [
    'Understand the mechanics and devastating effects of cache stampedes',
    'Identify scenarios vulnerable to "dog-piling" when cache keys expire',
    'Implement asyncio.Lock-based stampede protection for single-process deployments',
    'Build a production-grade Redis distributed lock solution for multi-instance deployments',
    'Explore probabilistic early expiration as an alternative mitigation strategy',
  ],
  sections: [
    {
      id: 'what-is-stampede',
      type: 'concept',
      title: 'What is a Cache Stampede?',
      content: `Imagine an incredibly popular API endpoint on your FastAPI server — perhaps the dashboard data for your SaaS, or real-time ticketing availability. This endpoint is highly optimized: it queries the database, performs complex aggregations, and caches the result for 60 seconds. Everything is blazing fast.

Then, at exactly 60.001 seconds, the cache expires.

In the next 100 milliseconds, 500 simultaneous requests hit the endpoint. The first request sees a cache miss and starts the heavy database query to regenerate the data. But before it can finish and populate the cache, the other 499 requests also see a cache miss. They all decide to run the heavy database query.

This is a **Cache Stampede** (also known as a Thundering Herd or Dog-piling).

The database gets slammed with 500 identical, expensive queries at once. CPU spikes, connections max out, and the database grinds to a halt or crashes. The cache, designed to protect the database, ironically becomes the catalyst for its demise when it expires.`,
    },
    {
      id: 'vulnerable-implementation',
      type: 'implementation',
      title: 'The Vulnerable Pattern',
      content: 'Here is the naive cache-aside pattern that is vulnerable to stampedes. Every concurrent cache miss fires the expensive query:',
      codeExample: {
        id: 'vulnerable-cache',
        language: 'python',
        title: 'Vulnerable Cache-Aside Implementation',
        filename: 'vulnerable_cache.py',
        code: `from fastapi import FastAPI
import asyncio
import time

app = FastAPI()

# Simple in-memory cache
cache: dict = {}
CACHE_TTL = 5  # seconds

async def expensive_db_query(item_id: int):
    print(f"🔥 EXECUTING HEAVY DB QUERY FOR {item_id}")
    await asyncio.sleep(2)  # Simulate slow query
    return {"id": item_id, "data": "very complex data", "timestamp": time.time()}

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    # Check Cache
    cached_item = cache.get(item_id)
    if cached_item and time.time() - cached_item["timestamp"] < CACHE_TTL:
        print(f"✅ Cache Hit for {item_id}")
        return cached_item["data"]

    # CACHE MISS!
    # If 100 concurrent requests reach here,
    # 100 expensive_db_query calls are fired simultaneously.
    print(f"❌ Cache Miss for {item_id}")
    data = await expensive_db_query(item_id)

    # Save to Cache
    cache[item_id] = {"data": data, "timestamp": time.time()}
    return data`,
      },
    },
    {
      id: 'asyncio-lock-solution',
      type: 'implementation',
      title: 'Single-Process Fix: asyncio.Lock with Double-Checked Locking',
      content: `The most reliable way to prevent a cache stampede is to ensure that when a cache miss occurs, **only one request** is allowed to regenerate the cache. All other concurrent requests wait.

In a single-process deployment, \`asyncio.Lock\` works perfectly. The critical technique here is **Double-Checked Locking** — you must check the cache again *after* acquiring the lock, because another request may have already populated it while you were waiting.`,
      codeExample: {
        id: 'asyncio-lock-cache',
        language: 'python',
        title: 'asyncio.Lock with Double-Checked Locking',
        filename: 'single_process_cache.py',
        code: `from fastapi import FastAPI
import asyncio
import time
from collections import defaultdict

app = FastAPI()
cache: dict = {}
CACHE_TTL = 5

# One lock per item — prevents unrelated items from blocking each other
item_locks: dict = defaultdict(asyncio.Lock)

async def expensive_db_query(item_id: int):
    print(f"🔥 EXECUTING HEAVY DB QUERY FOR {item_id}")
    await asyncio.sleep(2)
    return {"id": item_id, "data": "very complex data", "timestamp": time.time()}

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    # 1. First check: is it in cache?
    cached_item = cache.get(item_id)
    if cached_item and time.time() - cached_item["timestamp"] < CACHE_TTL:
        return cached_item["data"]

    # 2. Cache miss. Acquire the per-item lock.
    async with item_locks[item_id]:
        # 3. SECOND CHECK: Did another request populate the cache
        #    while we were waiting for the lock?
        #    This is the crucial "Double-Checked Locking" pattern.
        cached_item = cache.get(item_id)
        if cached_item and time.time() - cached_item["timestamp"] < CACHE_TTL:
            print(f"✅ Cache Hit (after waiting for lock) for {item_id}")
            return cached_item["data"]

        # 4. We are the chosen one. Execute the query.
        print(f"❌ Cache Miss. Fetching {item_id}")
        data = await expensive_db_query(item_id)

        cache[item_id] = {"data": data, "timestamp": time.time()}
        return data`,
      },
    },
    {
      id: 'distributed-lock-solution',
      type: 'production',
      title: 'Production Architecture: Redis Distributed Lock',
      content: `The \`asyncio.Lock\` approach only works if you have a **single worker process**. In production, you likely run multiple workers (\`uvicorn --workers 4\`) or multiple containers across different servers.

In a distributed environment, an \`asyncio.Lock\` in Server A won't stop Server B from executing the query. We need a **Distributed Lock** backed by Redis using the \`SET NX PX\` atomic command.`,
      codeExample: {
        id: 'redis-distributed-lock',
        language: 'python',
        title: 'Production Redis Distributed Lock',
        filename: 'distributed_cache.py',
        code: `from fastapi import FastAPI
import asyncio
import json
import redis.asyncio as redis
from contextlib import asynccontextmanager

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await redis_client.aclose()

app = FastAPI(lifespan=lifespan)

async def expensive_db_query(item_id: int) -> dict:
    await asyncio.sleep(2)
    return {"id": item_id, "data": "complex production data"}

async def get_cached_or_compute(item_id: int) -> dict:
    cache_key = f"item:{item_id}"
    lock_key = f"lock:item:{item_id}"

    # 1. Try cache first
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    # 2. Cache miss — try to acquire distributed lock
    # NX=True: "Set only if Not eXists" — atomic test-and-set
    # PX=5000: auto-expire lock after 5s to prevent deadlocks on crash
    lock_acquired = await redis_client.set(lock_key, "locked", nx=True, px=5000)

    if lock_acquired:
        try:
            # We won the lock — recompute the data
            data = await expensive_db_query(item_id)
            # Cache with 60s TTL
            await redis_client.set(cache_key, json.dumps(data), ex=60)
            return data
        finally:
            # ALWAYS release the lock, even on exception
            await redis_client.delete(lock_key)
    else:
        # Another worker is computing it — poll cache until it appears
        for _ in range(10):  # Retry up to 10 times (5 seconds)
            await asyncio.sleep(0.5)
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)

        # Timeout: fallback or error
        raise TimeoutError("Timeout waiting for cache regeneration")

@app.get("/items/{item_id}")
async def get_item(item_id: int):
    return await get_cached_or_compute(item_id)`,
      },
    },
  ],
  codeExamples: [],
  challenges: [
    {
      id: 'ch8-6-1',
      title: 'Implement Double-Checked Distributed Locking',
      description: 'The production code has a flaw: if the lock holder crashes and the lock expires, polling requesters may time out without data. Refactor `get_cached_or_compute` using a while loop that re-attempts lock acquisition if polling fails, implementing true double-checked distributed locking.',
      hint: 'Use a while loop. In each iteration: check cache, try to acquire lock, if no lock then sleep briefly and try again.',
      solution: `async def get_cached_or_compute_robust(item_id: int) -> dict:
    cache_key = f"item:{item_id}"
    lock_key = f"lock:item:{item_id}"
    max_wait = 10.0  # max 10 seconds total
    waited = 0.0

    while waited < max_wait:
        # 1. Always check cache first
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

        # 2. Try to acquire lock
        if await redis_client.set(lock_key, "locked", nx=True, px=5000):
            try:
                data = await expensive_db_query(item_id)
                await redis_client.set(cache_key, json.dumps(data), ex=60)
                return data
            finally:
                await redis_client.delete(lock_key)

        # 3. Lock held by another — wait briefly and retry
        await asyncio.sleep(0.5)
        waited += 0.5

    raise TimeoutError(f"Could not compute item {item_id} within {max_wait}s")`,
      solutionCode: {
        id: 'double-checked-solution',
        language: 'python',
        title: 'Robust Double-Checked Distributed Lock',
        filename: 'robust_cache.py',
        code: `async def get_cached_or_compute_robust(item_id: int) -> dict:
    cache_key = f"item:{item_id}"
    lock_key = f"lock:item:{item_id}"
    max_wait = 10.0
    waited = 0.0

    while waited < max_wait:
        cached_data = await redis_client.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

        if await redis_client.set(lock_key, "locked", nx=True, px=5000):
            try:
                data = await expensive_db_query(item_id)
                await redis_client.set(cache_key, json.dumps(data), ex=60)
                return data
            finally:
                await redis_client.delete(lock_key)

        await asyncio.sleep(0.5)
        waited += 0.5

    raise TimeoutError(f"Could not compute item {item_id} within {max_wait}s")`,
      },
    },
  ],
  interviewQuestions: [
    {
      id: 'iq-8-6-1',
      question: 'What is a cache stampede and how do you prevent it in a multi-container FastAPI deployment?',
      answer: 'A cache stampede occurs when a highly accessed cache key expires, causing a flood of simultaneous requests to experience a cache miss and hit the database concurrently. In a multi-container deployment, local memory locks (asyncio.Lock) are insufficient because each container has its own lock. To prevent it, we use a Redis distributed lock with SET NX PX. When a cache miss occurs, a worker attempts to acquire the lock. If successful, it queries the DB and updates the cache. If unsuccessful, it polls the cache until the first worker populates it. This ensures only one DB query executes cluster-wide.',
      difficulty: 'expert',
    },
    {
      id: 'iq-8-6-2',
      question: 'Why is a TTL on the distributed lock itself crucial?',
      answer: 'If a worker acquires the lock but then crashes or hangs before releasing it, other workers would be blocked indefinitely (deadlock). Setting a TTL via PX parameter in Redis ensures the lock auto-releases after a safe timeout, allowing another worker to take over. The TTL should be longer than the expected operation time to avoid false releases.',
      difficulty: 'expert',
    },
    {
      id: 'iq-8-6-3',
      question: 'What is Probabilistic Early Expiration and how does it differ from distributed locking?',
      answer: 'Probabilistic Early Expiration (PER) works by probabilistically triggering a cache refresh *before* the TTL expires. The closer to expiration, the higher the probability that a request triggers a background refresh while still returning the current cached value. This avoids latency spikes entirely (no waiting for lock) but adds complexity in managing background refresh. Locking is simpler and more predictable; PER is better for cases where the latency from waiting for a lock refresh is unacceptable.',
      difficulty: 'expert',
    },
  ],
  productionNotes: [
    {
      id: 'pn-8-6-1',
      severity: 'critical',
      content: 'Never use asyncio.Lock for stampede prevention in multi-worker or multi-instance deployments. asyncio.Lock is process-local. Worker B on a different machine has no knowledge of Worker A\'s lock. Always use Redis distributed locks in production.',
    },
    {
      id: 'pn-8-6-2',
      severity: 'warning',
      content: 'Set the Redis lock TTL (PX) to at least 2-3x your expected DB query duration. If your query takes 2 seconds under normal load but 10 seconds under high load, set PX=30000 (30 seconds). A TTL that\'s too short can cause multiple workers to acquire the lock concurrently, defeating the purpose.',
    },
    {
      id: 'pn-8-6-3',
      severity: 'info',
      content: 'Monitor the rate of cache misses and lock acquisition failures in Prometheus. A spike in lock wait times indicates your DB query duration is approaching your lock TTL — time to optimize the query or increase the TTL.',
    },
  ],
  realWorldScenarios: [
    {
      id: 'rws-8-6-1',
      scenario: 'Ticket Sales Launch',
      problem: 'A major ticket booking site caches seat availability for 10 seconds. When 5,000 users hit the site simultaneously at launch and the cache expires, 5,000 DB queries fire at once, crashing the database at the worst possible moment.',
      solution: 'Implement Redis distributed locking on the availability query. Additionally, pre-warm the cache 30 seconds before the sale goes live using a Celery task. This ensures the cache is hot at launch time and the stampede is prevented from the first moment.',
    },
  ],
  commonMistakes: [
    {
      id: 'cm-8-6-1',
      title: 'Forgetting the Double-Check After Lock Acquisition',
      description: 'A very common mistake is not checking the cache again after acquiring the lock. Without this, all 500 requests queue up behind the lock and then execute the expensive query sequentially — one after another — taking 500 × 2 seconds = 1000 seconds total.',
      badCode: {
        id: 'bad-no-double-check',
        language: 'python',
        title: '❌ Missing Double-Check (still slow)',
        code: `async with item_locks[item_id]:
    # BUG: No cache check here!
    # Every waiting request will execute the query sequentially.
    data = await expensive_db_query(item_id)
    cache[item_id] = {"data": data, "timestamp": time.time()}
    return data`,
      },
      goodCode: {
        id: 'good-double-check',
        language: 'python',
        title: '✅ With Double-Check (correct)',
        code: `async with item_locks[item_id]:
    # Double-check: another request may have populated it while we waited
    cached_item = cache.get(item_id)
    if cached_item and time.time() - cached_item["timestamp"] < CACHE_TTL:
        return cached_item["data"]  # ← only one request reaches here

    data = await expensive_db_query(item_id)
    cache[item_id] = {"data": data, "timestamp": time.time()}
    return data`,
      },
    },
  ],
};
