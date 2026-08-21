import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch08Lessons: Record<string, Lesson> = {
  'caching-patterns-overview': {
    id: '08-01',
    slug: 'caching-patterns-overview',
    chapterId: 8,
    order: 1,
    title: 'Caching Patterns: Cache-Aside, Read-Through, Write-Through',
    description: 'Master the fundamental caching strategies and when to use them in FastAPI applications.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['07-05'],
    objectives: [
      'Implement cache-aside (lazy loading) correctly',
      'Understand read-through and write-through trade-offs',
      'Choose patterns based on read/write ratio',
      'Identify which data should never be cached',
    ],
    sections: [
      {
        id: 'caching-patterns-concepts',
        type: 'concept',
        title: 'Core Caching Architectures',
        content: `Caching is not just about putting data in Redis; it's about choosing the right interaction pattern between your application, your cache, and your primary datastore. The strategy you choose dictates your cache's complexity, data freshness, and system resilience.

The most common pattern in FastAPI applications is **Cache-Aside** (or lazy loading). In this pattern, the application is responsible for reading from the cache, fetching from the database on a miss, and writing the result back to the cache. It's resilient because if the cache goes down, the application can still fetch from the database directly (though slowly).

**Read-Through** and **Write-Through** patterns place the cache as an abstraction layer between the application and the database. While conceptually cleaner, they often require specific datastore capabilities or more complex intermediate services, making Cache-Aside the pragmatic default for most Python microservices.`,
      },
      {
        id: 'cache-aside-implementation',
        type: 'implementation',
        title: 'Implementing Cache-Aside in FastAPI',
        content: `Let's implement a robust Cache-Aside pattern. Notice how we handle cache misses, serialize data correctly using Pydantic, and ensure database connections aren't blocked during Redis operations.`,
        codeExample: {
          id: 'cache-aside-code',
          language: 'python',
          title: 'Cache-Aside Service',
          files: {
            'app/services/user_service.py': {
              language: 'python',
              code: `import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.models.user import User
from app.schemas.user import UserRead

class UserService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis
        
    async def get_user(self, user_id: int) -> Optional[UserRead]:
        cache_key = f"user:{user_id}"
        
        # 1. Try Cache First
        cached_data = await self.redis.get(cache_key)
        if cached_data:
            return UserRead.model_validate_json(cached_data)
            
        # 2. Cache Miss - Fetch from DB
        user = await self.db.get(User, user_id)
        if not user:
            return None
            
        user_schema = UserRead.model_validate(user)
        
        # 3. Populate Cache (fire and forget / async)
        await self.redis.setex(
            cache_key,
            3600,  # 1 hour TTL
            user_schema.model_dump_json()
        )
        
        return user_schema`
            }
          }
        }
      },
      {
        id: 'caching-production-considerations',
        type: 'production',
        title: 'Production Caching Rules',
        content: `When scaling caches in production, you must establish strict rules about what NOT to cache. Never cache highly volatile data (like real-time stock ticks) unless using specific write-behind strategies. Never cache PII or sensitive data without explicit encryption at rest in the cache.

Furthermore, always design your system to survive a total cache wipe. If your database cannot handle the load of 100% cache misses, your system is fragile. This is where rate limiting, circuit breakers, and read-replicas become essential companions to your caching layer.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-cache-aside-vs-read-through',
        question: 'What is the main operational difference between Cache-Aside and Read-Through caching?',
        answer: 'In Cache-Aside, the application interacts with both the cache and the database directly. In Read-Through, the application only asks the cache for data, and the cache provider itself is responsible for fetching missing data from the database. Cache-aside is simpler to implement in code but requires the app to orchestrate the flow.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-cache-fallback',
        severity: 'critical',
        content: 'Always wrap Redis calls in try/except blocks. If Redis goes down, your app should log an error and fall back to the database, not crash.'
      }
    ],
    codeExamples: [],
    challenges: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'ttl-strategies': {
    id: '08-02',
    slug: 'ttl-strategies',
    chapterId: 8,
    order: 2,
    title: 'TTL Strategies & Cache Sizing',
    description: 'Learn how to determine the correct Time-To-Live for different data types and right-size your Redis clusters.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.redis],
    prerequisites: ['08-01'],
    objectives: [
      'Categorize data by volatility for TTL assignment',
      'Use sliding TTL for active-user data',
      'Size cache by working set, not total dataset',
      'Monitor cache eviction rates for sizing decisions',
    ],
    sections: [
      {
        id: 'ttl-concepts',
        type: 'concept',
        title: 'Dynamic TTL Management',
        content: `Assigning a blanket 1-hour TTL to all cached data is a common anti-pattern. Different domains of data have drastically different lifespans. Static configurations might change once a month, while active user sessions need extending constantly.

A robust caching layer categorizes data into tiers. "Immutable" data gets very long TTLs (days/weeks). "Volatile" data gets short TTLs (seconds/minutes). For data tied to active user sessions, we use a "Sliding Expiration" strategy, where every read resets the TTL, ensuring active data stays hot while dormant data naturally expires to free up memory.`
      },
      {
        id: 'sliding-ttl-implementation',
        type: 'implementation',
        title: 'Implementing Sliding TTL',
        content: `Here's how to implement a sliding TTL in Redis using pipelines to minimize network roundtrips. We fetch the data and extend the expiry in a single atomic operation.`,
        codeExample: {
          id: 'sliding-ttl-code',
          language: 'python',
          title: 'Sliding Session Cache',
          code: `async def get_active_session(redis: Redis, session_id: str, ttl_seconds: int = 1800):
    cache_key = f"session:{session_id}"
    
    # Use pipeline to read and extend TTL atomically
    pipe = redis.pipeline()
    pipe.get(cache_key)
    pipe.expire(cache_key, ttl_seconds)
    
    results = await pipe.execute()
    session_data = results[0]
    
    if not session_data:
        return None
        
    return json.loads(session_data)`
        }
      },
      {
        id: 'cache-sizing-architecture',
        type: 'architecture',
        title: 'Sizing Your Redis Cluster',
        content: `Never size your cache based on the total size of your database. Caches should only hold the "working set" — the data actively being accessed.

Configure Redis with an appropriate maxmemory policy, typically \`allkeys-lru\` or \`volatile-lru\`. When memory fills up, Redis automatically evicts the least recently used keys. If your eviction rate is very high and cache hit ratio is dropping, your working set exceeds your cache size, and you need to scale up memory.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-redis-eviction',
        question: 'What happens in Redis when it runs out of memory, and how do you configure it?',
        answer: 'Redis behavior depends on the maxmemory-policy configuration. By default, it might return an error on write (noeviction). For caching, it should be set to an LRU (Least Recently Used) or LFU policy like volatile-lru (evict keys with expiration) or allkeys-lru (evict any key) to automatically make room for new data.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-redis-memory',
        severity: 'warning',
        content: 'Always set a maxmemory limit on Redis when used as a cache. Without it, Redis can consume all system memory, causing the OS to kill the process via OOM Killer.'
      }
    ],
    codeExamples: [],
    challenges: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'cache-hit-ratio-metrics': {
    id: '08-03',
    slug: 'cache-hit-ratio-metrics',
    chapterId: 8,
    order: 3,
    title: 'Measuring Cache Performance',
    description: 'Implement Prometheus metrics to track cache hit ratios and measure the real impact of your caching layer.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.prometheus],
    prerequisites: ['08-01'],
    objectives: [
      'Track cache hits and misses with counters',
      'Calculate and alert on cache hit ratio',
      'Measure miss penalty (DB query time)',
      'Build a caching metrics dashboard',
    ],
    sections: [
      {
        id: 'metrics-concepts',
        type: 'concept',
        title: 'The Cache Hit Ratio',
        content: `You cannot optimize what you do not measure. The most critical metric for any cache is the Cache Hit Ratio (Hits / (Hits + Misses)). A ratio of 95% means 95 out of 100 requests were served from memory, shielding your database.

However, hit ratio alone isn't enough. You must also measure the "Miss Penalty" — the latency introduced when a cache miss occurs and you have to query the database and update the cache. If the miss penalty is too high, cold starts or cache stampedes can bring down your application. Tracking these via Prometheus allows you to set up alerts when caching effectiveness drops.`
      },
      {
        id: 'prometheus-cache-metrics',
        type: 'implementation',
        title: 'Instrumenting Cache Metrics',
        content: `We can use the Prometheus client library to create counters for hits and misses, labeled by the specific cache prefix to identify which data entities are performing well.`,
        codeExample: {
          id: 'cache-metrics-code',
          language: 'python',
          title: 'Prometheus Instrumented Cache',
          code: `from prometheus_client import Counter, Histogram
import time

CACHE_REQUESTS = Counter(
    'cache_requests_total',
    'Total cache requests',
    ['prefix', 'status']  # status can be 'hit' or 'miss'
)

MISS_PENALTY = Histogram(
    'cache_miss_penalty_seconds',
    'Time spent resolving a cache miss',
    ['prefix']
)

async def get_with_metrics(redis, db, prefix: str, key_id: str, fetch_func):
    cache_key = f"{prefix}:{key_id}"
    cached = await redis.get(cache_key)
    
    if cached:
        CACHE_REQUESTS.labels(prefix=prefix, status='hit').inc()
        return json.loads(cached)
        
    CACHE_REQUESTS.labels(prefix=prefix, status='miss').inc()
    
    start_time = time.perf_counter()
    db_data = await fetch_func(db, key_id)
    duration = time.perf_counter() - start_time
    
    MISS_PENALTY.labels(prefix=prefix).observe(duration)
    
    if db_data:
        await redis.setex(cache_key, 3600, json.dumps(db_data))
        
    return db_data`
        }
      },
      {
        id: 'dashboard-realworld',
        type: 'realworld',
        title: 'The Silent Degradation',
        content: `At a major e-commerce company, a bug in product ID formatting caused cache keys to be generated differently on read vs write. The system silently degraded to a 0% cache hit ratio. 

Because they had no alerts on the cache hit ratio, the issue wasn't caught until Black Friday traffic hit, overwhelming the primary database and causing a 40-minute outage. Always set up Prometheus alerts if the \`rate(cache_requests_total{status="hit"}[5m]) / rate(cache_requests_total[5m])\` drops below your expected baseline.`
      }
    ],
    challenges: [
      {
        id: 'ch-metric-decorator',
        title: 'Cache Metrics Decorator',
        description: 'Create a Python decorator that wraps a caching function and automatically tracks hits, misses, and execution time using Prometheus metrics.',
        hint: 'The decorator needs to inspect the return value of the wrapped function or the Redis call to determine if it was a hit or miss.',
        solution: 'Detailed solution showing a robust async decorator for cache tracking.',
        solutionCode: {
          id: 'sol-metric-decorator',
          language: 'python',
          title: 'Decorator Solution',
          filename: 'decorators.py',
          code: `from functools import wraps

def track_cache_metrics(prefix: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Assumes function handles cache internal logic 
            # and returns a tuple (data, is_hit) for tracking purposes
            data, is_hit = await func(*args, **kwargs)
            
            status = 'hit' if is_hit else 'miss'
            CACHE_REQUESTS.labels(prefix=prefix, status=status).inc()
            return data
        return wrapper
    return decorator`
        }
      }
    ],
    codeExamples: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'cache-warming': {
    id: '08-04',
    slug: 'cache-warming',
    chapterId: 8,
    order: 4,
    title: 'Cache Warming & Preloading',
    description: 'Prevent cold-start latency spikes by proactively loading critical data into Redis before traffic hits.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.celery, technologies.fastapi],
    prerequisites: ['08-01'],
    objectives: [
      'Identify top N most accessed cache keys',
      'Implement background cache warming on startup',
      'Use Celery to warm caches asynchronously',
      'Monitor cache warm-up progress',
    ],
    sections: [
      {
        id: 'warming-concepts',
        type: 'concept',
        title: 'The Need for Preloading',
        content: `When a new environment is spun up, or after a massive cache flush, your cache is completely empty (a "cold cache"). If high traffic hits a cold cache, every request bypasses the cache and hits the database simultaneously. This can easily overload the database before the cache has a chance to populate.

Cache Warming (or preloading) is the practice of proactively pushing high-value, frequently accessed data into the cache *before* it's requested by users. This is typically done via background tasks (like Celery) or startup scripts, ensuring the system can handle traffic immediately upon going live.`
      },
      {
        id: 'warming-implementation',
        type: 'implementation',
        title: 'Celery Cache Warming Task',
        content: `We can use a background worker like Celery to load the top 1000 most active products into Redis. This script can be triggered via a cron job every night or manually after a deployment.`,
        codeExample: {
          id: 'warming-code',
          language: 'python',
          title: 'Warming Task',
          files: {
            'worker/tasks.py': {
              language: 'python',
              code: `from celery import shared_task
from redis import Redis
from sqlalchemy import create_engine, select
from app.models import Product

redis_client = Redis(host='redis', port=6379, db=0)
engine = create_engine('postgresql://user:pass@db/dbname')

@shared_task
def warm_product_cache():
    # Fetch top 1000 most viewed products
    with engine.connect() as conn:
        query = select(Product).order_by(Product.views.desc()).limit(1000)
        top_products = conn.execute(query).fetchall()
        
    pipeline = redis_client.pipeline()
    for product in top_products:
        cache_key = f"product:{product.id}"
        # Convert row to dict/json here
        data = {"id": product.id, "name": product.name, "price": str(product.price)}
        pipeline.setex(cache_key, 86400, json.dumps(data))
        
    # Execute all sets in a bulk operation
    pipeline.execute()
    return f"Warmed {len(top_products)} products"`
            }
          }
        }
      },
      {
        id: 'warming-architecture',
        type: 'architecture',
        title: 'Startup vs Background Warming',
        content: `You can perform warming during FastAPI's lifespan events (startup), but this delays the application from accepting requests until warming is complete. For large datasets, this is unacceptable in modern orchestrated environments (like Kubernetes) where fast boot times are required.

The architectural best practice is to decouple warming. Use Celery or dedicated CronJobs in Kubernetes to populate Redis independently of the web API pods. The web pods boot instantly, and if the cache isn't fully warmed, they simply experience standard cache misses until the background job finishes.`
      }
    ],
    productionNotes: [
      {
        id: 'pn-pipeline-warming',
        severity: 'info',
        content: 'Always use Redis pipelines when warming caches. Issuing 10,000 separate SET commands over the network will be extremely slow. Pipelines batch these commands efficiently.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'negative-caching': {
    id: '08-05',
    slug: 'negative-caching',
    chapterId: 8,
    order: 5,
    title: 'Negative Caching',
    description: 'Protect your database from repeated queries for non-existent records by caching null results.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['08-01'],
    objectives: [
      'Cache null/empty responses with short TTL',
      'Handle cache invalidation when data is created',
      'Prevent cache-based resource enumeration',
      'Design TTL for negative cache entries',
    ],
    sections: [
      {
        id: 'negative-caching-concept',
        type: 'concept',
        title: 'Caching the Absence of Data',
        content: `Standard caching logic usually dictates: if data is found in DB, put it in cache. But what if the data doesn't exist? If a user repeatedly requests \`/users/99999\` (which doesn't exist), the cache is bypassed every time, sending the query straight to the database.

Malicious users or aggressive bots can exploit this to perform a Denial of Service (DoS) attack by querying random IDs, forcing expensive database lookups. **Negative Caching** solves this by explicitly caching the *fact that the record does not exist*. We store a special flag (like an empty string or specific JSON structure) to indicate a known 404.`
      },
      {
        id: 'negative-caching-implementation',
        type: 'implementation',
        title: 'Implementing Negative Caching',
        content: `When a DB query returns no result, we store a specific placeholder in Redis. Importantly, negative cache entries usually require shorter TTLs, so that if the record is later created, it becomes available relatively quickly.`,
        codeExample: {
          id: 'negative-cache-code',
          language: 'python',
          title: 'Negative Caching Logic',
          code: `async def get_user_with_negative_cache(user_id: int):
    cache_key = f"user:{user_id}"
    cached = await redis.get(cache_key)
    
    if cached is not None:
        # Check for our negative cache sentinel value
        if cached == b"__NOT_FOUND__":
            return None  # Fast 404
        return json.loads(cached)
        
    user = await db.get(User, user_id)
    
    if not user:
        # Cache the negative result with a short TTL (e.g., 60 seconds)
        await redis.setex(cache_key, 60, "__NOT_FOUND__")
        return None
        
    # Cache positive result with normal TTL (e.g., 1 hour)
    await redis.setex(cache_key, 3600, json.dumps(user.dict()))
    return user`
        }
      },
      {
        id: 'negative-cache-invalidation',
        type: 'production',
        title: 'Handling Creation Invalidation',
        content: `The main risk of negative caching is temporal staleness. If User 123 is queried, returns 404, and is negatively cached, and then User 123 is immediately created, the system might still return 404 for the next 60 seconds.

To mitigate this, your creation endpoints (POST /users) must actively delete or overwrite the cache key for the newly created resource. This ensures the negative cache is immediately busted upon resource creation.`
      }
    ],
    commonMistakes: [
      {
        id: 'cm-false-positive-cache',
        title: 'Failing to Distinguish None from Miss',
        description: 'Developers often check `if not cached_data:` which evaluates to True for both a cache miss (None) and an empty string (cached negative result).',
        badCode: {
          id: 'bad-none-check',
          language: 'python',
          title: '❌ Wrong Way',
          code: `cached = await redis.get(key)
if not cached:  # FAILS: Bypasses cache if value is empty string/bytes
    db_data = fetch()
    redis.set(key, db_data or "")`
        },
        goodCode: {
          id: 'good-none-check',
          language: 'python',
          title: '✅ Correct Way',
          code: `cached = await redis.get(key)
if cached is None:  # ONLY True on actual cache miss
    db_data = fetch()
    redis.set(key, db_data or "__404__")
elif cached == b"__404__":
    return None`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'cache-stampede-protection': {
    id: '08-06',
    slug: 'cache-stampede-protection',
    chapterId: 8,
    order: 6,
    title: 'Cache Stampede Protection',
    description: 'Prevent database overload using probabilistic early expiration (XFetch).',
    duration: 60,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['08-01'],
    objectives: [],
    sections: [],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'request-coalescing': {
    id: '08-07',
    slug: 'request-coalescing',
    chapterId: 8,
    order: 7,
    title: 'Request Coalescing',
    description: 'Merge identical concurrent requests to prevent duplicate database work during cache misses.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.redis, technologies.python],
    prerequisites: ['08-01'],
    objectives: [
      'Implement request coalescing with asyncio.Event',
      'Broadcast results to all waiting requesters',
      'Handle errors in coalesced requests',
      'Measure coalescing effectiveness with metrics',
    ],
    sections: [
      {
        id: 'coalescing-concepts',
        type: 'concept',
        title: 'The Thundering Herd Problem',
        content: `When a highly popular cache key expires, thousands of concurrent requests might arrive simultaneously. They will all experience a cache miss, and they will all attempt to query the database and write to the cache. This is known as a Thundering Herd.

While probabilistic early expiration (XFetch) helps prevent expiration-based stampedes, it doesn't solve the problem for new keys or complete cache flushes. **Request Coalescing** (or request collapsing) solves this at the application layer. When multiple identical requests arrive, only the first request is allowed to query the database. The other concurrent requests wait for the first one to finish, and then they all share the resulting data.`
      },
      {
        id: 'coalescing-implementation',
        type: 'implementation',
        title: 'Asyncio Coalescing in Python',
        content: `We can use a global dictionary to track in-flight requests and \`asyncio.Event\` to make subsequent requests wait for the primary worker.`,
        codeExample: {
          id: 'coalescing-code',
          language: 'python',
          title: 'Request Coalescer',
          code: `import asyncio
from typing import Any, Callable, Dict, Tuple

class RequestCoalescer:
    def __init__(self):
        # Maps key -> (asyncio.Event, Result, Exception)
        self._in_flight: Dict[str, Tuple[asyncio.Event, Any, Exception]] = {}
        
    async def get_or_compute(self, key: str, compute_func: Callable) -> Any:
        if key in self._in_flight:
            # Another request is already computing this. Wait for it.
            event, result, exc = self._in_flight[key]
            await event.wait()
            # Fetch the updated result from the map
            _, result, exc = self._in_flight[key]
            if exc:
                raise exc
            return result
            
        # We are the first! Set up the event.
        event = asyncio.Event()
        self._in_flight[key] = (event, None, None)
        
        try:
            result = await compute_func()
            self._in_flight[key] = (event, result, None)
            return result
        except Exception as e:
            self._in_flight[key] = (event, None, e)
            raise e
        finally:
            # Wake up all waiting requests and clean up
            event.set()
            # Delay deletion slightly to allow waiters to read the result
            asyncio.create_task(self._cleanup(key))`
        }
      },
      {
        id: 'coalescing-architecture',
        type: 'architecture',
        title: 'Single Node vs Distributed',
        content: `The Python asyncio approach works perfectly for coalescing requests hitting a single FastAPI worker process (e.g., Uvicorn worker). However, in a distributed environment with 50 pods, you still get 50 DB queries (one per pod). 

For true distributed coalescing, you must use a distributed lock mechanism in Redis. The first pod acquires the lock, queries the DB, and populates the cache. The other pods fail to acquire the lock, back off slightly, and retry reading from the cache.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-coalescing-vs-locking',
        question: 'What is the difference between Request Coalescing and a Distributed Lock?',
        answer: 'Request Coalescing typically happens in-memory within a single process to collapse concurrent identical requests into one async task. A Distributed Lock (like Redis Redlock) spans across multiple servers/processes to ensure only one node in the entire cluster performs an operation.',
        difficulty: 'expert'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'distributed-cache-consistency': {
    id: '08-08',
    slug: 'distributed-cache-consistency',
    chapterId: 8,
    order: 8,
    title: 'Distributed Cache Consistency',
    description: 'Keep your cache and database synchronized to avoid serving stale or incorrect data.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.postgresql],
    prerequisites: ['08-01'],
    objectives: [
      'Understand the CAP theorem for caches',
      'Implement consistent cache invalidation across instances',
      'Use versioned cache keys for atomic updates',
      'Handle cache consistency during deployments',
    ],
    sections: [
      {
        id: 'consistency-concepts',
        type: 'concept',
        title: 'The Hardest Problem in Computer Science',
        content: `As the old joke goes, "There are only two hard things in Computer Science: cache invalidation and naming things." When you update a database record, the corresponding cache entry becomes stale. 

If you update the database but fail to update the cache (due to a network blip or app crash), your system is left in an inconsistent state. Users will see old data until the cache TTL expires. Achieving strong consistency between a database and a remote cache is technically a distributed transaction problem.`
      },
      {
        id: 'invalidation-strategies',
        type: 'architecture',
        title: 'Strategies for Consistency',
        content: `There are three primary ways to handle invalidation on write:

1. **Delete-on-Write**: Update the DB, then delete the cache key. The next read will cause a miss and fetch fresh data. This is safest.
2. **Update-on-Write**: Update the DB, then update the cache with new data. Saves a read query, but harder to handle concurrent race conditions.
3. **Change Data Capture (CDC)**: The application only writes to the DB. A separate process (like Debezium) listens to PostgreSQL WAL logs and automatically updates/invalidates Redis. This removes the responsibility from the application entirely.`
      },
      {
        id: 'versioned-keys',
        type: 'implementation',
        title: 'Versioned Cache Keys',
        content: `A powerful pattern to avoid race conditions during concurrent updates is using versioned keys based on a timestamp or modification counter. Instead of storing \`user:123\`, you store a map pointing to the current version, and cache the actual data under \`user:123:v5\`.`,
        codeExample: {
          id: 'versioned-keys-code',
          language: 'python',
          title: 'Versioned Cache Keys',
          code: `async def get_versioned_user(db, redis, user_id):
    # 1. Fetch current version (fast, small)
    version = await redis.get(f"user_version:{user_id}") or "v1"
    
    # 2. Try fetching data using specific version
    data_key = f"user_data:{user_id}:{version}"
    data = await redis.get(data_key)
    
    if data:
        return json.loads(data)
        
    # 3. Cache Miss - Fetch DB
    user = await db.get(User, user_id)
    
    # 4. Save with version
    await redis.setex(data_key, 3600, json.dumps(user.dict()))
    return user
    
async def update_user(db, redis, user_id, new_data):
    # Update DB
    await db.update(...)
    # Invalidate by simply bumping the version number
    new_version = f"v{int(time.time())}"
    await redis.set(f"user_version:{user_id}", new_version)`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-race-condition',
        scenario: 'The Concurrent Update Race',
        problem: 'Thread A fetches User (age=20). Thread B updates DB to age=21 and deletes cache. Thread A (which was paused by OS) wakes up and writes age=20 to cache. Cache is now permanently stale.',
        solution: 'Use distributed locks during read-modify-write cycles, or use CDC to guarantee ordered cache invalidation.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'cache-avalanche-prevention': {
    id: '08-09',
    slug: 'cache-avalanche-prevention',
    chapterId: 8,
    order: 9,
    title: 'Cache Avalanche Prevention',
    description: 'Ensure system stability by preventing mass simultaneous cache expirations.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.postgresql],
    prerequisites: ['08-01'],
    objectives: [
      'Add jitter to TTL values to spread expiration',
      'Pre-warm critical cache entries before expiration',
      'Implement circuit breakers for database protection',
      'Monitor for cascading cache miss patterns',
    ],
    sections: [
      {
        id: 'avalanche-concepts',
        type: 'concept',
        title: 'The Avalanche Effect',
        content: `A Cache Avalanche differs from a Stampede. A Stampede is many requests hitting ONE expired key. An Avalanche is many different cache keys expiring at the EXACT SAME TIME, causing a massive wave of varied database queries that brings the primary datastore to its knees.

This typically happens when a large batch of data is loaded into the cache simultaneously (like via a midnight CRON job) with the exact same TTL (e.g., 24 hours). Exactly 24 hours later, the entire dataset evaporates from memory simultaneously.`
      },
      {
        id: 'jitter-implementation',
        type: 'implementation',
        title: 'TTL Jitter (Randomization)',
        content: `The easiest and most effective way to prevent avalanches is to add "Jitter" (randomness) to your TTLs. If you want data cached for an hour, cache it for an hour PLUS OR MINUS 5 minutes. This mathematically smears the expirations across a 10-minute window, allowing the database to handle the regeneration smoothly.`,
        codeExample: {
          id: 'jitter-code',
          language: 'python',
          title: 'TTL Jitter Function',
          code: `import random

def get_jittered_ttl(base_ttl_seconds: int, variance_percent: float = 0.1) -> int:
    """
    Returns a TTL randomized by +/- the variance percentage.
    e.g., base_ttl=3600, variance=0.1 -> returns between 3240 and 3960
    """
    variance = base_ttl_seconds * variance_percent
    jitter = random.uniform(-variance, variance)
    return int(base_ttl_seconds + jitter)

# Usage during cache set
async def cache_result(redis, key: str, data: dict):
    # Instead of strict 3600s
    ttl = get_jittered_ttl(3600, 0.15) 
    await redis.setex(key, ttl, json.dumps(data))`
        }
      },
      {
        id: 'circuit-breakers',
        type: 'production',
        title: 'Database Circuit Breakers',
        content: `Even with jitter, an avalanche can occur if Redis crashes entirely. To survive this, your application must implement Circuit Breakers around database queries. If the DB response time spikes or connections fail, the circuit breaker opens, and the application immediately returns 503 Service Unavailable for new requests rather than endlessly queuing DB connections and causing a cascading system failure.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'multilayer-caching': {
    id: '08-10',
    slug: 'multilayer-caching',
    chapterId: 8,
    order: 10,
    title: 'Multi-Layer Caching Architecture',
    description: 'Combine in-memory L1 caches with distributed L2 Redis caches for maximum extreme performance.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi, technologies.nginx],
    prerequisites: ['08-01'],
    objectives: [
      'Implement in-process LRU cache with TTL',
      'Combine local + Redis caching with fallback logic',
      'Invalidate multi-layer caches correctly',
      'Measure latency improvement per cache layer',
    ],
    sections: [
      {
        id: 'multilayer-concepts',
        type: 'concept',
        title: 'L1 and L2 Caching',
        content: `While Redis is incredibly fast (sub-millisecond), it still requires a network hop. For ultra-high-throughput endpoints, network I/O becomes the bottleneck. 

Multi-layer caching introduces an L1 cache (in-memory within the Python process) backed by an L2 cache (Redis). The L1 cache avoids the network entirely, operating in nanoseconds. If data isn't in L1, we check L2. If not in L2, we check the database. 

However, multi-layer caching drastically increases the complexity of cache invalidation, because invalidating Redis does not automatically invalidate the L1 caches across your 50 worker pods.`
      },
      {
        id: 'l1-implementation',
        type: 'implementation',
        title: 'Implementing Python L1 Cache',
        content: `We can use Python libraries like \`cachetools\` to implement a thread-safe, TTL-based L1 cache inside our FastAPI application.`,
        codeExample: {
          id: 'l1-l2-code',
          language: 'python',
          title: 'Two-Tier Cache Service',
          files: {
            'app/services/cache.py': {
              language: 'python',
              code: `from cachetools import TTLCache
import asyncio

# L1 Cache: Max 1000 items, expires in 60 seconds
# Stays in application memory
l1_cache = TTLCache(maxsize=1000, ttl=60)

async def get_multilayer(key: str, redis, db_fetch_func):
    # 1. Check L1 (Local RAM)
    if key in l1_cache:
        return l1_cache[key]
        
    # 2. Check L2 (Redis over Network)
    l2_data = await redis.get(key)
    if l2_data:
        parsed = json.loads(l2_data)
        # Populate L1 for next time
        l1_cache[key] = parsed
        return parsed
        
    # 3. Cache Miss - Fetch DB
    db_data = await db_fetch_func()
    
    # 4. Populate L2 and L1
    await redis.setex(key, 3600, json.dumps(db_data))
    l1_cache[key] = db_data
    
    return db_data`
            }
          }
        }
      },
      {
        id: 'multilayer-pubsub',
        type: 'architecture',
        title: 'Invalidating L1 via Pub/Sub',
        content: `The biggest challenge is that L1 caches are isolated per worker process. If Worker A updates a user, it can update its own L1 cache and Redis, but Worker B still has the old data in its L1 cache.

To solve this, use Redis Pub/Sub. When any worker updates data, it publishes an invalidation message to a Redis channel. A background task in EVERY worker listens to this channel and proactively deletes the stale keys from their local L1 \`TTLCache\`.`
      }
    ],
    productionNotes: [
      {
        id: 'pn-l1-memory',
        severity: 'warning',
        content: 'Be extremely careful with L1 cache sizes. If you cache large objects and have 8 Uvicorn workers per pod, your memory usage will multiply by 8. Always use maxsize limits (LRU).'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  }
};
