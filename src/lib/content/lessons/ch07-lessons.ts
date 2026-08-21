import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch07Lessons: Record<string, Lesson> = {
  'redis-architecture': {
    id: '07-01',
    slug: 'redis-architecture',
    chapterId: 7,
    order: 1,
    title: 'Redis Architecture & Internals',
    description: 'Deep dive into Redis single-threaded model, persistence, and topology.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis],
    prerequisites: [],
    objectives: [
      'Explain Redis single-threaded execution model',
      'Compare RDB vs AOF persistence',
      'Understand Redis Sentinel vs Redis Cluster',
      'Monitor Redis memory usage and eviction policies'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Redis Single-Threaded Event Loop',
        content: `Redis is primarily single-threaded when it comes to processing commands. This design choice by Salvatore Sanfilippo eliminates lock overhead, context switching, and race conditions, resulting in incredibly high throughput for simple operations. Redis uses a multiplexed event loop to handle concurrent client connections. \n\nBecause it's single-threaded, any long-running command (like \`KEYS *\` or huge Lua scripts) blocks the entire server. This is why algorithmic complexity (Big O notation) is documented for every Redis command.`
      },
      {
        id: 'sec-persistence',
        type: 'architecture',
        title: 'Persistence: RDB vs AOF',
        content: `Redis offers two primary persistence mechanisms: RDB (Redis Database) and AOF (Append Only File).\n\nRDB takes point-in-time snapshots. It is compact and fast to load but can lead to data loss if Redis crashes between snapshots. AOF logs every write operation. It provides better durability but results in larger files and slower recovery. In production, a hybrid approach (AOF with RDB preamble) is often used to balance durability and performance.`
      },
      {
        id: 'sec-topology',
        type: 'architecture',
        title: 'High Availability Topologies',
        content: `For high availability, Redis offers Sentinel and Cluster. Sentinel monitors master-replica sets and performs automatic failover if the master dies. It acts as a configuration provider for clients.\n\nRedis Cluster provides automatic data sharding across multiple nodes. Data is distributed using hash slots. Cluster is designed for horizontal scaling, allowing you to partition data across many machines while providing HA within each shard.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Why is Redis single-threaded and how does it achieve high concurrency?',
        answer: 'Redis uses a single thread to process commands to avoid lock overhead and context switching. It achieves high concurrency using an I/O multiplexing model (like epoll) to handle multiple client connections simultaneously on that single thread.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never use the KEYS command in production. It blocks the single event loop. Use SCAN instead for iterating over keys.'
      }
    ],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'redis-data-structures': {
    id: '07-02',
    slug: 'redis-data-structures',
    chapterId: 7,
    order: 2,
    title: 'Redis Data Structures In-Depth',
    description: 'Master Strings, Hashes, Lists, and Sorted Sets for real-world use cases.',
    duration: 55,
    difficulty: 'advanced',
    technologies: [technologies.redis],
    prerequisites: ['07-01'],
    objectives: [
      'Use Strings for caching and counters',
      'Use Hashes for object storage',
      'Use Sorted Sets for leaderboards and rate limiting',
      'Use Lists as queues and stacks'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Beyond Simple Strings',
        content: `While Redis Strings are powerful (capable of storing JSON, bitmaps, or integers for atomic INCR operations), Redis shines with its advanced data structures. Hashes (HSET/HGET) are perfect for representing objects, allowing you to update individual fields without fetching the entire object.\n\nLists (LPUSH/RPOP) serve as excellent lightweight message queues. Sorted Sets (ZADD/ZRANGE) are unique to Redis, maintaining a score for each member. They are the go-to solution for leaderboards, priority queues, and complex rate-limiting algorithms.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Implementing a Leaderboard with Sorted Sets',
        content: `Sorted sets maintain unique elements ordered by a floating-point score. When multiple elements have the same score, they are ordered lexicographically.`,
        codeExample: {
          id: 'code-zset',
          language: 'python',
          title: 'Leaderboard Service',
          filename: 'leaderboard.py',
          code: `import redis.asyncio as redis

class Leaderboard:
    def __init__(self, redis_client, board_name):
        self.redis = redis_client
        self.board = board_name

    async def add_score(self, user_id: str, score: int):
        # Update user's score in the sorted set
        await self.redis.zadd(self.board, {user_id: score})

    async def get_top_n(self, n: int = 10):
        # ZREVRANGE fetches items in descending order
        # withscores=True returns tuples of (member, score)
        return await self.redis.zrevrange(self.board, 0, n - 1, withscores=True)

    async def get_user_rank(self, user_id: str):
        # ZREVRANK is 0-indexed, so we add 1
        rank = await self.redis.zrevrank(self.board, user_id)
        return rank + 1 if rank is not None else None
`
        }
      },
      {
        id: 'sec-hashes',
        type: 'architecture',
        title: 'Memory Optimization with Hashes',
        content: `Redis optimizes memory for small hashes using a "ziplist" encoding. A ziplist is a specially encoded doubly linked list that is highly memory efficient. If a hash has fewer elements than \`hash-max-ziplist-entries\` and the largest element is smaller than \`hash-max-ziplist-value\`, it uses a ziplist. Grouping related keys into small hashes can dramatically reduce memory usage compared to storing them as individual top-level strings.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-2',
        question: 'How would you implement a rate limiter using Redis?',
        answer: 'You can use a Sorted Set where the member is the request ID (or timestamp) and the score is the timestamp. You remove elements older than the time window using ZREMRANGEBYSCORE, then count the remaining elements. Alternatively, for simpler cases, use INCR with an EXPIRE on a string key formatted like rate_limit:ip:minute.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-2',
        severity: 'info',
        content: 'When designing keys, use a consistent namespace separated by colons, e.g., user:1000:profile.'
      }
    ],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'redis-transactions': {
    id: '07-03',
    slug: 'redis-transactions',
    chapterId: 7,
    order: 3,
    title: 'Redis Transactions: MULTI/EXEC/WATCH',
    description: 'Ensuring atomicity and handling optimistic locking in Redis.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis],
    prerequisites: ['07-01'],
    objectives: [
      'Execute atomic blocks with MULTI/EXEC',
      'Use WATCH for optimistic locking',
      'Handle WATCH failures with retries',
      'Understand transaction limitations in Redis Cluster'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Optimistic Locking with WATCH',
        content: `Redis transactions (MULTI/EXEC) guarantee that commands are executed sequentially without interference from other clients. However, they don't support rollbacks if a command fails during execution.\n\nTo perform conditional updates (e.g., read a value, compute a new value, and save it only if no one else changed it), Redis uses the WATCH command. WATCH implements optimistic locking. If the watched key is modified by another client before EXEC is called, the entire transaction is aborted, returning a null reply.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Safe Account Transfer',
        content: `Here is how to implement a safe fund transfer using WATCH to avoid race conditions.`,
        codeExample: {
          id: 'code-watch',
          language: 'python',
          title: 'Fund Transfer',
          filename: 'transfer.py',
          code: `import redis.asyncio as redis
from redis.exceptions import WatchError

async def transfer_funds(r: redis.Redis, from_acct: str, to_acct: str, amount: int):
    async with r.pipeline() as pipe:
        while True:
            try:
                # Watch the sender's account for changes
                await pipe.watch(from_acct)
                
                # Check balance
                balance = int(await pipe.get(from_acct) or 0)
                if balance < amount:
                    await pipe.unwatch()
                    raise ValueError("Insufficient funds")
                
                # Transaction starts here
                pipe.multi()
                pipe.decrby(from_acct, amount)
                pipe.incrby(to_acct, amount)
                
                # Execute the transaction
                await pipe.execute()
                break # Success!
            except WatchError:
                # Another client modified from_acct, retry
                continue
`
        }
      },
      {
        id: 'sec-limitations',
        type: 'production',
        title: 'Cluster Limitations',
        content: `In Redis Cluster, transactions (MULTI/EXEC) and Lua scripts are only supported if all keys involved hash to the same slot. You must use hash tags (e.g., \`{user:1000}:balance\`, \`{user:1000}:profile\`) to force keys into the same slot if you need to transact across them.`
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'lua-scripting': {
    id: '07-04',
    slug: 'lua-scripting',
    chapterId: 7,
    order: 4,
    title: 'Lua Scripts for Atomic Operations',
    description: 'Writing and executing custom Lua scripts for complex atomic logic.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.python],
    prerequisites: ['07-03'],
    objectives: [
      'Write Lua scripts executed atomically in Redis',
      'Use KEYS and ARGV in Lua scripts',
      'Load scripts with SCRIPT LOAD for reuse',
      'Debug Lua scripts safely'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Why Lua in Redis?',
        content: `Lua scripting allows you to execute complex logic atomically inside the Redis server. When Redis executes a Lua script, it pauses all other operations. This ensures atomicity without the back-and-forth network latency of WATCH/MULTI/EXEC loops.\n\nScripts receive keys and arguments separately (KEYS array and ARGV array in Lua). Separating them is crucial because Redis needs to know which keys a script touches for clustering and replication purposes.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Atomic Rate Limiting with Lua',
        content: `A fixed-window rate limiter is much safer to implement as a Lua script to avoid race conditions between getting the count and setting the expiration.`,
        codeExample: {
          id: 'code-lua',
          language: 'python',
          title: 'Lua Rate Limiter',
          filename: 'limiter.py',
          code: `import redis.asyncio as redis

# Lua script to increment a counter and set expiration if it's new
# Returns 1 if allowed, 0 if rate limit exceeded
LUA_SCRIPT = """
local current = redis.call('GET', KEYS[1])
if current and tonumber(current) >= tonumber(ARGV[1]) then
    return 0
end
current = redis.call('INCR', KEYS[1])
if tonumber(current) == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end
return 1
"""

class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        # Pre-load the script to the server for efficiency
        self._script = self.redis.register_script(LUA_SCRIPT)

    async def is_allowed(self, key: str, max_requests: int, window: int) -> bool:
        result = await self._script(keys=[key], args=[max_requests, window])
        return bool(result)
`
        }
      },
      {
        id: 'sec-prod',
        type: 'production',
        title: 'Script Caching',
        content: `Always load scripts into the Redis script cache using \`SCRIPT LOAD\` (handled automatically by \`register_script\` in redis-py) and execute them via their SHA1 digest (\`EVALSHA\`). Sending the full script text over the network for every execution wastes bandwidth and CPU.`
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-4',
        severity: 'critical',
        content: 'Lua scripts block the entire Redis server. Ensure your scripts execute in microseconds. Do not use loops that iterate over thousands of elements.'
      }
    ],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'distributed-locks': {
    id: '07-05',
    slug: 'distributed-locks',
    chapterId: 7,
    order: 5,
    title: 'Distributed Locks with Redis',
    description: 'Mastering the SET NX EX pattern and Redlock.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.python],
    prerequisites: ['07-04'],
    objectives: [
      'Implement the SET NX EX lock pattern correctly',
      'Validate lock ownership before release',
      'Use Lua for atomic lock release',
      'Understand Redlock and its controversies'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'The Anatomy of a Distributed Lock',
        content: `In distributed systems, you often need to ensure only one process performs a task (e.g., cron job, cache warming). Redis handles this using the \`SET key value NX EX seconds\` command. \`NX\` ensures the key is set only if it does not exist, and \`EX\` prevents deadlocks if the locking process crashes.\n\nHowever, a critical safety issue arises when releasing the lock. If process A acquires the lock, stalls, and the lock expires, process B can acquire it. When process A recovers, it might accidentally release process B's lock. Therefore, the lock value must be a unique token (like a UUID), and the release operation must atomically check the token before deleting the key via a Lua script.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Safe Lock Implementation',
        content: `Implementing a safe distributed lock in Python.`,
        codeExample: {
          id: 'code-lock',
          language: 'python',
          title: 'Distributed Lock',
          filename: 'lock.py',
          code: `import uuid
import redis.asyncio as redis
from contextlib import asynccontextmanager

RELEASE_LUA = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""

class RedisLock:
    def __init__(self, redis_client, name: str, timeout: int = 10):
        self.redis = redis_client
        self.name = f"lock:{name}"
        self.timeout = timeout
        self.token = str(uuid.uuid4())
        self._release_script = self.redis.register_script(RELEASE_LUA)

    async def acquire(self) -> bool:
        return await self.redis.set(
            self.name, 
            self.token, 
            nx=True, 
            ex=self.timeout
        )

    async def release(self) -> bool:
        res = await self._release_script(keys=[self.name], args=[self.token])
        return bool(res)

@asynccontextmanager
async def lock_manager(redis_client, name: str):
    lock = RedisLock(redis_client, name)
    acquired = await lock.acquire()
    try:
        yield acquired
    finally:
        if acquired:
            await lock.release()
`
        }
      },
      {
        id: 'sec-redlock',
        type: 'architecture',
        title: 'The Redlock Algorithm',
        content: `For single Redis instances, the above pattern is sufficient. However, if the master dies before replicating the lock to a replica, the lock is lost. The Redlock algorithm (proposed by Redis creator) attempts to solve this by acquiring locks across N independent Redis nodes. It has faced criticism regarding its assumptions about clock drift and system pauses, but remains widely used for high-stakes locking.`
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'redis-streams': {
    id: '07-06',
    slug: 'redis-streams',
    chapterId: 7,
    order: 6,
    title: 'Redis Streams for Event Processing',
    description: 'Building reliable event-driven architectures with Streams and Consumer Groups.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.python],
    prerequisites: ['07-02'],
    objectives: [
      'Create and publish to Redis Streams',
      'Consume messages with consumer groups',
      'Implement message acknowledgment',
      'Handle failed messages in the pending list'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Streams and Consumer Groups',
        content: `Redis Streams is an append-only log data structure, similar to Kafka. It solves the unreliability of Pub/Sub and the lack of multiplexing in Lists. Streams store messages permanently (until explicitly trimmed) and allow consumers to read from a specific ID.\n\nConsumer Groups allow multiple workers to cooperatively consume a stream. Redis keeps track of which messages have been delivered to which consumer and requires an explicit acknowledgment (XACK) when processing is complete. Unacknowledged messages sit in the Pending Entries List (PEL).`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Consuming from a Stream',
        content: `Using python redis to consume messages in a group.`,
        codeExample: {
          id: 'code-stream',
          title: 'Stream Worker',
          files: {
            'worker.py': {
              language: 'python',
              code: `import asyncio
import redis.asyncio as redis
from redis.exceptions import ResponseError

async def setup_group(r: redis.Redis, stream: str, group: str):
    try:
        # MKSTREAM creates the stream if it doesn't exist
        await r.xgroup_create(stream, group, id="0", mkstream=True)
    except ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise

async def process_messages(r: redis.Redis, stream: str, group: str, consumer: str):
    await setup_group(r, stream, group)
    
    while True:
        # Block for 5 seconds waiting for new messages ('>')
        # '>' means messages never delivered to any consumer in the group
        messages = await r.xreadgroup(group, consumer, {stream: ">"}, count=10, block=5000)
        
        for stream_name, msg_list in messages:
            for msg_id, data in msg_list:
                print(f"Processing {msg_id}: {data}")
                # Simulate work
                await asyncio.sleep(0.1)
                
                # Acknowledge completion
                await r.xack(stream, group, msg_id)
`
            }
          }
        }
      },
      {
        id: 'sec-pel',
        type: 'architecture',
        title: 'Handling Failures (XPENDING & XCLAIM)',
        content: `If a consumer crashes after receiving a message but before calling XACK, the message remains in the PEL. Robust stream consumers must periodically run a "garbage collection" task that uses \`XPENDING\` to find old unacknowledged messages and \`XCLAIM\` to reassign ownership of those messages to healthy consumers.`
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'pub-sub': {
    id: '07-07',
    slug: 'pub-sub',
    chapterId: 7,
    order: 7,
    title: 'Redis Pub/Sub for Real-Time Messaging',
    description: 'Low-latency broadcast messaging for WebSockets and live updates.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Publish and subscribe to Redis channels',
      'Use pattern subscriptions for wildcard channels',
      'Understand Pub/Sub vs Streams trade-offs',
      'Scale Pub/Sub horizontally for WebSockets'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Fire-and-Forget Messaging',
        content: `Redis Pub/Sub implements the publish/subscribe messaging paradigm. It is completely fire-and-forget: if a subscriber is disconnected when a message is published, that message is lost forever. There is no persistence, no acknowledgment, and no concept of consumer groups.\n\nDespite this, Pub/Sub is incredibly useful for real-time signaling, chat applications, and broadcasting state changes across distributed WebSocket servers where missing a historical message isn't critical.`
      },
      {
        id: 'sec-websockets',
        type: 'architecture',
        title: 'Scaling WebSockets with Pub/Sub',
        content: `When a client connects to a FastAPI WebSocket, they connect to one specific server instance. If a user on Server A wants to chat with a user on Server B, Server A cannot communicate directly with Server B's WebSocket. By having all servers subscribe to a Redis channel (e.g., \`chat:global\`), Server A publishes the message to Redis, Redis broadcasts it to all servers, and Server B routes it to its local WebSocket client.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Pub/Sub Listener Task',
        content: `Integrating aioredis Pub/Sub into a FastAPI app.`,
        codeExample: {
          id: 'code-pubsub',
          language: 'python',
          title: 'WebSocket Broadcaster',
          filename: 'pubsub.py',
          code: `import asyncio
import redis.asyncio as redis
from fastapi import FastAPI, WebSocket

app = FastAPI()
redis_client = redis.Redis(host="localhost", port=6379)
active_connections = set()

async def redis_listener():
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("chat_channel")
    
    async for message in pubsub.listen():
        if message["type"] == "message":
            data = message["data"].decode("utf-8")
            # Broadcast to all local websocket connections
            for conn in active_connections:
                await conn.send_text(data)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(redis_listener())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Publish to Redis so ALL servers get the message
            await redis_client.publish("chat_channel", data)
    finally:
        active_connections.remove(websocket)
`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'cache-invalidation': {
    id: '07-08',
    slug: 'cache-invalidation',
    chapterId: 7,
    order: 8,
    title: 'Cache Invalidation Strategies',
    description: 'Keeping Redis in sync with PostgreSQL data safely and efficiently.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.postgresql],
    prerequisites: ['07-02'],
    objectives: [
      'Implement TTL-based expiration',
      'Use event-driven invalidation on data changes',
      'Handle cache invalidation in distributed systems',
      'Avoid cache poisoning attacks'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'The Hardest Problem in Computer Science',
        content: `Cache invalidation is notoriously difficult. When the source of truth (PostgreSQL) changes, the cache (Redis) becomes stale. The simplest strategy is TTL (Time-To-Live), where keys expire automatically. This is eventual consistency. For stronger consistency, write-through or write-behind patterns are used.\n\nIn modern web architectures, a common approach is application-level invalidation: the API layer explicitly deletes the cached key whenever a mutation endpoint (POST/PUT/DELETE) modifies the corresponding resource.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Cache Invalidation Service',
        content: `A service pattern combining DB writes with cache deletion.`,
        codeExample: {
          id: 'code-inval',
          title: 'User Service with Cache',
          files: {
            'service.py': {
              language: 'python',
              code: `import json
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from models import User

class UserService:
    def __init__(self, db: AsyncSession, redis: redis.Redis):
        self.db = db
        self.redis = redis

    async def get_user(self, user_id: int):
        cache_key = f"user:{user_id}"
        
        # 1. Try cache
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
            
        # 2. Fetch from DB
        user = await self.db.get(User, user_id)
        if user:
            # 3. Populate cache with TTL
            await self.redis.set(cache_key, json.dumps(user.to_dict()), ex=3600)
            
        return user

    async def update_user(self, user_id: int, data: dict):
        # 1. Update Database
        user = await self.db.get(User, user_id)
        for k, v in data.items():
            setattr(user, k, v)
        await self.db.commit()
        
        # 2. Invalidate Cache explicitly after DB success
        # Do not update the cache directly to avoid race conditions!
        await self.redis.delete(f"user:{user_id}")
        
        return user
`
            }
          }
        }
      },
      {
        id: 'sec-cdc',
        type: 'architecture',
        title: 'CDC (Change Data Capture)',
        content: `For mission-critical synchronization, relying on the application to delete cache keys can lead to inconsistency if the app crashes between the DB commit and the Redis delete. Enterprise architectures use CDC tools (like Debezium) to read the PostgreSQL WAL (Write-Ahead Log) and asynchronously propagate changes to Redis, completely decoupling caching from application logic.`
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'memory-management': {
    id: '07-09',
    slug: 'memory-management',
    chapterId: 7,
    order: 9,
    title: 'Redis Memory Management & Eviction',
    description: 'Understanding maxmemory policies, LRU/LFU, and handling OOM conditions.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis],
    prerequisites: ['07-01'],
    objectives: [
      'Configure maxmemory and eviction policies',
      'Choose between LRU, LFU, and TTL eviction',
      'Monitor memory fragmentation',
      'Handle Redis OOM errors gracefully in application code'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Maxmemory and Eviction Policies',
        content: `Redis holds all data in RAM. When it reaches the limit defined by \`maxmemory\` in \`redis.conf\`, it must decide what to do with new writes. The default behavior is \`noeviction\`, which returns an error for write commands, preventing memory growth but breaking application write logic.\n\nTo act as a cache, Redis must be configured with an eviction policy. \`allkeys-lru\` evicts the Least Recently Used keys regardless of TTL. \`volatile-ttl\` evicts keys with the shortest remaining TTL. \`allkeys-lfu\` (Least Frequently Used) tracks access frequency, ensuring popular items remain in cache even if temporarily unaccessed.`
      },
      {
        id: 'sec-frag',
        type: 'architecture',
        title: 'Memory Fragmentation',
        content: `Redis memory footprint is often larger than the actual data due to fragmentation. When keys are updated or deleted, the OS allocator (jemalloc) might not be able to immediately reuse the freed memory. Monitor the \`mem_fragmentation_ratio\` via the \`INFO memory\` command. A ratio > 1.5 indicates high fragmentation. Redis 4+ includes active defragmentation (\`activedefrag yes\`) to slowly pack memory continuously in the background.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Handling OOM Exceptions',
        content: `If you use Redis for both cache (evictable) and primary state (e.g., sessions, rate limits), an OOM error is a critical failure.`,
        codeExample: {
          id: 'code-oom',
          language: 'python',
          title: 'Safe Redis Write',
          filename: 'cache.py',
          code: `import redis.asyncio as redis
from redis.exceptions import ResponseError
import logging

logger = logging.getLogger(__name__)

async def safe_cache_set(r: redis.Redis, key: str, value: str, ttl: int):
    try:
        await r.set(key, value, ex=ttl)
    except ResponseError as e:
        if "OOM" in str(e):
            # Log critical alert, but don't crash the request
            # if this is just an optimization cache
            logger.error(f"Redis OOM. Could not cache {key}.")
        else:
            raise
`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'redis-cluster': {
    id: '07-10',
    slug: 'redis-cluster',
    chapterId: 7,
    order: 10,
    title: 'Redis Cluster & High Availability',
    description: 'Scaling Redis horizontally with automatic sharding and failover.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis],
    prerequisites: ['07-01'],
    objectives: [
      'Understand Redis Cluster hash slots',
      'Configure Redis Sentinel for HA',
      'Handle MOVED and ASK redirections in clients',
      'Perform rolling upgrades of Redis Cluster'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Data Sharding with Hash Slots',
        content: `Redis Cluster distributes data across multiple master nodes to scale CPU and memory horizontally. It does not use consistent hashing. Instead, it uses 16,384 "hash slots". Every key is hashed using CRC16 modulo 16384 to determine its slot. Each master node is responsible for a subset of these slots.\n\nUnlike Sentinel, Cluster nodes communicate with each other via a gossip protocol on a separate bus port (usually port + 10000) to detect node failures and automatically promote replicas.`
      },
      {
        id: 'sec-routing',
        type: 'architecture',
        title: 'Client-Side Routing',
        content: `In Redis Cluster, the client is responsible for knowing which node holds which slot. If a client sends a command for key A to Node 1, but Node 2 owns the slot for key A, Node 1 responds with a \`MOVED Node2IP\` error. A cluster-aware client (like \`redis-py-cluster\` or standard \`redis-py\` in cluster mode) caches the slot-to-node mapping. Upon seeing a MOVED error, it updates its internal map and redirects the query to Node 2.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'Connecting to a Cluster',
        content: `Using the cluster client in redis-py requires a slightly different initialization.`,
        codeExample: {
          id: 'code-cluster',
          language: 'python',
          title: 'Cluster Client',
          filename: 'cluster.py',
          code: `from redis.asyncio.cluster import RedisCluster
from redis.exceptions import RedisClusterException

async def init_cluster():
    # You only need to provide a few known nodes (startup nodes).
    # The client will discover the rest of the topology automatically.
    rc = RedisCluster(
        startup_nodes=[
            {"host": "redis-node-1", "port": 6379},
            {"host": "redis-node-2", "port": 6379}
        ],
        decode_responses=True
    )
    
    # Operations look exactly the same as standalone Redis
    await rc.set("foo", "bar")
    print(await rc.get("foo"))
    
    return rc
`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'redis-async-python': {
    id: '07-11',
    slug: 'redis-async-python',
    chapterId: 7,
    order: 11,
    title: 'Redis with Async Python',
    description: 'Best practices for redis-py async connection pools and pipelining.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Configure redis.asyncio connection pool',
      'Use pipelines for batched commands',
      'Handle Redis connection errors gracefully',
      'Test Redis-dependent code with fakeredis'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Connection Pooling in Async Context',
        content: `Establishing a TCP connection to Redis takes time. Creating a new connection for every request in a FastAPI app will cripple performance and exhaust socket descriptors. \`redis.asyncio\` handles this via a ConnectionPool. By default, the Redis client instance manages a pool internally.\n\nYou should create a single global Redis client instance on application startup and share it across all requests, allowing it to manage a pool of reusable connections.`
      },
      {
        id: 'sec-pipelines',
        type: 'architecture',
        title: 'Reducing Network RTT with Pipelines',
        content: `Network latency (RTT - Round Trip Time) is often the bottleneck in Redis operations, not Redis CPU. If you need to execute 10 independent \`SET\` commands, sending them sequentially incurs 10 network round trips. A Pipeline batches the commands client-side, sends them in a single TCP packet, and receives all responses at once, drastically reducing latency.`
      },
      {
        id: 'sec-impl',
        type: 'implementation',
        title: 'FastAPI Integration & Pipelining',
        content: `Proper lifecycle management and pipeline usage in FastAPI.`,
        codeExample: {
          id: 'code-fastapi',
          language: 'python',
          title: 'FastAPI Redis',
          filename: 'main.py',
          code: `from fastapi import FastAPI
import redis.asyncio as redis

app = FastAPI()
redis_client = None

@app.on_event("startup")
async def startup():
    global redis_client
    # max_connections prevents exhausting server resources
    pool = redis.ConnectionPool.from_url(
        "redis://localhost:6379", 
        max_connections=50,
        decode_responses=True
    )
    redis_client = redis.Redis(connection_pool=pool)

@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.aclose()

@app.post("/users/{user_id}/stats")
async def update_stats(user_id: int):
    # Use pipeline to batch commands
    async with redis_client.pipeline() as pipe:
        pipe.incr(f"stats:users:{user_id}:logins")
        pipe.set(f"stats:users:{user_id}:last_login", "2023-10-25")
        pipe.sadd("active_users_today", user_id)
        
        # Execute all commands in one network trip
        results = await pipe.execute()
        
    return {"status": "ok", "operations": results}
`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'redis-security': {
    id: '07-12',
    slug: 'redis-security',
    chapterId: 7,
    order: 12,
    title: 'Redis Security in Production',
    description: 'Securing Redis deployments with ACLs, TLS, and network isolation.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis],
    prerequisites: [],
    objectives: [
      'Enable Redis AUTH and ACL users',
      'Configure TLS for Redis connections',
      'Bind Redis to private networks only',
      'Audit Redis commands with command logging'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Zero Trust Redis',
        content: `Historically, Redis prioritized performance over security, assuming it would only run in trusted environments (binding to localhost without authentication). Exposing an unprotected Redis instance to the internet is disastrous, as attackers can use commands like \`CONFIG SET dir\` to write malicious SSH keys or cron jobs to the host filesystem.\n\nModern Redis security relies on three pillars: Network isolation (bind interfaces/VPCs), Transport security (TLS encryption), and Access Control (ACLs introduced in Redis 6).`
      },
      {
        id: 'sec-acl',
        type: 'architecture',
        title: 'Redis ACLs (Access Control Lists)',
        content: `Before Redis 6, authentication was a single global password (\`requirepass\`). ACLs allow you to define distinct users with granular permissions. You can restrict a user to specific command categories (e.g., read-only, no administrative commands) and restrict them to accessing only specific key prefixes (e.g., \`~cache:*\`). This follows the principle of least privilege for microservices.`
      },
      {
        id: 'sec-tls',
        type: 'implementation',
        title: 'Connecting with TLS and ACLs',
        content: `Python implementation for connecting to a secure Redis cluster using SSL and specific user credentials.`,
        codeExample: {
          id: 'code-tls',
          language: 'python',
          title: 'Secure Redis Connection',
          filename: 'secure.py',
          code: `import redis.asyncio as redis
import ssl

async def get_secure_connection():
    # Create SSL context validating the server's certificate
    ssl_context = ssl.create_default_context()
    
    # URL format: rediss://user:password@host:port
    # Note the extra 's' in 'rediss' for TLS
    client = redis.from_url(
        "rediss://api_worker:secure_password123@redis.internal:6379",
        ssl_cert_reqs="required",
        ssl_context=ssl_context,
        decode_responses=True
    )
    
    await client.ping()
    return client
`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: 'pn-12',
        severity: 'critical',
        content: 'Always disable dangerous commands in production. Use the rename-command directive in redis.conf to rename commands like FLUSHALL, FLUSHDB, KEYS, and CONFIG to unguessable strings or disable them entirely by renaming them to ""'
      }
    ],
    commonMistakes: [],
    challenges: [],
    realWorldScenarios: [],
    codeExamples: [],
  }
};
