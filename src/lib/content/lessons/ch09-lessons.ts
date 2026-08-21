import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch09Lessons: Record<string, Lesson> = {
  'why-rate-limiting': {
    id: '09-01',
    slug: 'why-rate-limiting',
    chapterId: 9,
    order: 1,
    title: 'Why Rate Limiting Exists',
    description: 'Understand the core purposes of rate limiting in web APIs and when to use it.',
    duration: 30,
    difficulty: 'advanced',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Explain the three purposes of rate limiting',
      'Identify endpoints that need rate limiting most',
      'Choose rate limit values for different endpoint types',
      'Understand rate limiting vs DDoS protection'
    ],
    sections: [
      {
        id: 'concepts',
        type: 'concept',
        title: 'The Trinity of API Protection',
        content: `Rate limiting fundamentally serves three distinct purposes in a modern API ecosystem: resource protection, cost control, and business model enforcement (monetization). Many developers mistakenly conflate rate limiting solely with DDoS protection, which is actually best handled at the network edge (Layer 3/4) by services like Cloudflare or AWS Shield.
        
Resource protection ensures that a single misbehaving client (or runaway script) cannot exhaust server resources—CPU, memory, database connection pools, or external API quotas. Cost control is tightly linked to serverless architecture or third-party APIs where every request incurs a direct financial cost (e.g., calling an LLM API).
        
Finally, monetization involves tiered limits based on subscription plans. Free users might get 100 req/day, while Enterprise gets 10,000 req/minute. In FastAPI, implementing these logic flows effectively is paramount because it sits at Layer 7 (Application Layer) where we have full context about the user's identity, tier, and the specific endpoint's cost.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Identifying Vulnerable Endpoints',
        content: `Not all endpoints are created equal. You must apply different limits based on computational cost and security implications. Login and password reset endpoints should have strict limits (e.g., 5 req/min) to prevent brute-force and credential stuffing attacks. Data-heavy endpoints (e.g., generating reports) need limits to prevent database thrashing.
        
In FastAPI, we typically define these varying limits by decorating routers or using dependency injection. Here is a conceptual mapping of how you might structure this.`,
        codeExample: {
          id: 'endpoint-limits',
          language: 'python',
          title: 'Endpoint Rate Mapping (Conceptual)',
          filename: 'app/limits.py',
          code: `from enum import Enum

class LimitTier(Enum):
    LOGIN_STRICT = "5/minute"
    SEARCH_EXPENSIVE = "20/minute"
    READ_STANDARD = "100/minute"
    WEBHOOK_HEAVY = "500/second"

# Later we will use these to configure our rate limit dependencies or middleware.`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Where Rate Limiting Happens',
        content: `Rate limiting can be implemented at multiple layers: Web Application Firewall (WAF), API Gateway (like Kong or Nginx), or the Application layer (FastAPI).
        
While an API gateway is excellent for global limits (e.g., max 1000 requests/IP/minute), FastAPI is necessary for application-aware limits. For example, limiting "5 report generations per user per day" requires checking the user ID, their subscription tier, and the database state—things an API Gateway doesn't easily know without hitting your database anyway.
        
Therefore, a defense-in-depth approach is best: Gateway limits for general abuse and IP blocking, and FastAPI limits for business logic and tier-based restrictions.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the difference between rate limiting at an API Gateway vs within FastAPI?',
        answer: 'API Gateway limits are generally IP or basic token-based, faster, and protect the infrastructure as a whole. FastAPI limits have business context (user roles, subscription tiers, complex limits like tokens-per-minute for LLMs), making them highly customizable but slightly more computationally expensive.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-2',
        question: 'How does rate limiting differ from DDoS protection?',
        answer: 'DDoS protection operates at the network/transport layers (L3/L4) to absorb massive volumetric attacks before they reach the application. Rate limiting operates at the application layer (L7) to manage fair usage and prevent application-level resource exhaustion from authenticated or identified clients.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Do not rely entirely on FastAPI for global rate limiting. A massive spike in connections will still exhaust Uvicorn workers and TCP sockets. Use a reverse proxy like Nginx or a WAF for basic volumetric protection.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Runaway Script',
        problem: 'A B2B customer accidentally deployed an infinite loop in their integration script, hammering the API at 5,000 req/sec, crashing the database.',
        solution: 'Implemented basic 100 req/sec per-token rate limits in FastAPI and auto-banned tokens that hit the limit continuously for over 5 minutes, saving the database.'
      }
    ],
    codeExamples: [],
    challenges: [],
    commonMistakes: [],
  },
  'fixed-window-algorithm': {
    id: '09-02',
    slug: 'fixed-window-algorithm',
    chapterId: 9,
    order: 2,
    title: 'Fixed Window Counter Algorithm',
    description: 'Learn and implement the simplest rate limiting algorithm using Redis.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['09-01'],
    objectives: [
      'Implement fixed window counter in Redis',
      'Identify the window boundary attack',
      'Measure throughput with fixed window limiting',
      'Test rate limiting with load generation'
    ],
    sections: [
      {
        id: 'concept-fw',
        type: 'concept',
        title: 'The Fixed Window Counter',
        content: `The fixed window counter is the most intuitive rate limiting algorithm. Time is divided into fixed, discrete windows (e.g., 12:00:00 to 12:00:59). Every request increments a counter for the current window. If the counter exceeds the threshold, the request is rejected.
        
This is incredibly memory-efficient and fast to implement in Redis because it only requires one key per user per window, and we can set the key to expire automatically at the end of the window.
        
However, it suffers from the "boundary effect." If the limit is 100 requests per minute, a user can send 100 requests at 12:00:59, and another 100 at 12:01:00. This results in 200 requests hitting the server within a 2-second span, effectively doubling the intended maximum rate during the boundary transition.`
      },
      {
        id: 'implementation-fw',
        type: 'implementation',
        title: 'Implementing Fixed Window in Redis',
        content: `In Redis, we use the \`INCR\` command along with \`EXPIRE\`. A naive approach might be:
1. INCR the key.
2. If it's 1, EXPIRE it in 60s.
3. If value > limit, reject.

But doing this from Python in multiple round-trips is prone to race conditions if not pipelined. Instead, we use Redis Pipelines or simple Lua scripts to ensure atomicity.`,
        codeExample: {
          id: 'fw-redis',
          language: 'python',
          title: 'Fixed Window with Redis Pipeline',
          filename: 'app/fixed_window.py',
          code: `import time
from redis.asyncio import Redis

async def is_rate_limited(redis: Redis, user_id: str, limit: int, window: int = 60) -> bool:
    # Use integer division of current unix time to define the fixed window
    current_window = int(time.time() // window)
    key = f"rate_limit:{user_id}:{current_window}"
    
    # Use pipeline for atomic execution of INCR and EXPIRE
    pipe = redis.pipeline()
    pipe.incr(key)
    # Set expiration to window size + 1 to ensure it cleans up safely
    pipe.expire(key, window + 1)
    
    results = await pipe.execute()
    current_count = results[0]
    
    return current_count > limit`
        }
      },
      {
        id: 'production-fw',
        type: 'production',
        title: 'When to use Fixed Window',
        content: `Despite the boundary issue, Fixed Window is perfectly adequate for many use cases. If you are enforcing long limits (e.g., 5,000 requests per day), the likelihood of a perfectly timed 10,000 request burst at midnight is low, and usually tolerable. 
        
It is also heavily used for API Quotas (billing) rather than strict traffic shaping. If you need strict traffic smoothing (preventing spikes entirely), you must look at Leaky Bucket or Sliding Window algorithms.`
      }
    ],
    challenges: [
      {
        id: 'ch-fw',
        title: 'Implement the Fixed Window Route Dependency',
        description: 'Create a FastAPI Dependency that checks a limit of 5 requests per 10 seconds. Return an HTTP 429 status if exceeded.',
        hint: 'Use standard FastAPI `Depends` and raise `HTTPException(status_code=429)`',
        solution: 'The dependency wraps the Redis pipeline check and returns or raises the exception.',
        solutionCode: {
          id: 'sol-fw',
          language: 'python',
          title: 'Dependency Implementation',
          filename: 'dependency.py',
          code: `from fastapi import Depends, HTTPException, Request
from redis.asyncio import Redis
import time

async def get_redis():
    yield Redis(host='localhost', port=6379)

class FixedWindowRateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        
    async def __call__(self, request: Request, redis: Redis = Depends(get_redis)):
        client_ip = request.client.host
        current_window = int(time.time() // self.window)
        key = f"fw:{client_ip}:{current_window}"
        
        pipe = redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.window + 1)
        res = await pipe.execute()
        
        if res[0] > self.limit:
            raise HTTPException(status_code=429, detail="Too Many Requests")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-fw',
        question: 'What is the "boundary effect" or "thundering herd" problem in Fixed Window rate limiting?',
        answer: 'The boundary effect occurs when a user consumes their entire quota at the very end of one time window, and immediately consumes the new quota at the start of the next window. This results in double the permitted traffic arriving at the server in a very short time.',
        difficulty: 'advanced'
      }
    ],
    codeExamples: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'sliding-window-algorithm': {
    id: '09-03',
    slug: 'sliding-window-algorithm',
    chapterId: 9,
    order: 3,
    title: 'Sliding Window Log & Counter',
    description: 'Solve the boundary problem using sliding windows.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['09-02'],
    objectives: [
      'Implement sliding window log with Redis sorted sets',
      'Implement sliding window counter as approximation',
      'Compare memory usage: log vs counter',
      'Choose sliding window for security-sensitive limits'
    ],
    sections: [
      {
        id: 'concept-sw',
        type: 'concept',
        title: 'Sliding Window Log',
        content: `To solve the boundary effect of fixed windows, we can track the exact timestamp of every request. This is the Sliding Window Log algorithm. We maintain a log of request timestamps for each user. When a new request arrives, we remove all timestamps older than the window size (e.g., current time - 1 minute). Then, we count the remaining timestamps. If the count is below the limit, we accept the request and add its timestamp to the log.
        
In Redis, this is implemented using a Sorted Set (\`ZSET\`). The score and the member are both the Unix timestamp (often in milliseconds or microseconds to ensure uniqueness). 
        
While perfectly accurate and immune to boundary bursts, it is highly memory-intensive because it stores every single request. A 10,000 req/min limit means storing 10,000 elements per user.`
      },
      {
        id: 'implementation-swl',
        type: 'implementation',
        title: 'Sliding Window Log via Redis ZSET',
        content: `Here is how to implement the Sliding Window Log cleanly. We must do this atomically using a Redis pipeline.`,
        codeExample: {
          id: 'swl-code',
          language: 'python',
          title: 'Sliding Window Log',
          filename: 'app/sliding_log.py',
          code: `import time
import uuid
from redis.asyncio import Redis

async def check_sliding_window_log(redis: Redis, user_id: str, limit: int, window: int = 60) -> bool:
    key = f"swl:{user_id}"
    now = time.time()
    # Microsecond precision for uniqueness
    member = f"{now}:{uuid.uuid4()}" 
    window_start = now - window
    
    pipe = redis.pipeline()
    # 1. Remove timestamps older than our window
    pipe.zremrangebyscore(key, "-inf", window_start)
    # 2. Add current request
    pipe.zadd(key, {member: now})
    # 3. Count requests in the window
    pipe.zcard(key)
    # 4. Set expiry to auto-cleanup inactive users
    pipe.expire(key, window)
    
    results = await pipe.execute()
    current_count = results[2] # ZCARD result
    
    if current_count > limit:
        # Remove the member we just added since it was rejected
        await redis.zrem(key, member)
        return True
    return False`
        }
      },
      {
        id: 'concept-swc',
        type: 'architecture',
        title: 'Sliding Window Counter Approximation',
        content: `Because the log method uses too much memory for high volumes, the Sliding Window Counter algorithm combines fixed windows with a sliding window approximation.
        
Instead of storing every request, we store counters for fixed windows (e.g., one counter per minute). When a request comes in at 01:15:30 (halfway through the current minute), we take 50% of the previous minute's counter and add it to the current minute's counter.
        
Estimated Volume = (Prev_Window_Count * (1 - portion_of_current_window_elapsed)) + Current_Window_Count.
        
This requires vastly less memory (just two counters) while smoothing out the boundary effect beautifully.`
      }
    ],
    commonMistakes: [
      {
        id: 'cm-sw',
        title: 'Non-Unique ZSET Members',
        description: 'Using just the Unix timestamp integer as both the score and member in a Redis ZSET. If two requests happen in the exact same second/millisecond, the ZSET considers them the same member and overwrites, undercounting traffic.',
        badCode: {
          id: 'bc-sw',
          language: 'python',
          title: '❌ Undercounts concurrent requests',
          code: `now = int(time.time())
pipe.zadd(key, {now: now}) # Overwrites if two requests share same timestamp!`
        },
        goodCode: {
          id: 'gc-sw',
          language: 'python',
          title: '✅ Ensures uniqueness',
          code: `now = time.time()
unique_member = f"{now}:{uuid.uuid4()}"
pipe.zadd(key, {unique_member: now})`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'token-bucket-leaky-bucket': {
    id: '09-04',
    slug: 'token-bucket-leaky-bucket',
    chapterId: 9,
    order: 4,
    title: 'Token Bucket & Leaky Bucket',
    description: 'Master the industry-standard algorithms for handling bursty traffic and smoothing out requests.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.python],
    prerequisites: ['09-02'],
    objectives: [
      'Implement token bucket with Redis and Lua',
      'Implement leaky bucket for constant output rate',
      'Allow bursts with token bucket',
      'Choose token vs leaky bucket for API gateways'
    ],
    sections: [
      {
        id: 'concept-tb',
        type: 'concept',
        title: 'Token Bucket Algorithm',
        content: `The Token Bucket algorithm is the gold standard for rate limiting, used by AWS, Stripe, and most major APIs. Imagine a bucket with a maximum capacity (e.g., 10 tokens). Tokens are added to the bucket at a fixed rate (e.g., 2 tokens per second) until the bucket is full.
        
When a request arrives, it attempts to take a token from the bucket. If a token is available, the request proceeds. If the bucket is empty, the request is dropped (HTTP 429). 
        
The killer feature of Token Bucket is that it allows bursts. If the bucket is full, a user can instantly send 10 requests. However, after the burst, they are strictly limited to the refill rate of 2 per second.`
      },
      {
        id: 'implementation-tb',
        type: 'implementation',
        title: 'Token Bucket in Redis (with Lua)',
        content: `Implementing Token Bucket correctly in Redis requires atomic operations, otherwise race conditions will cause tokens to leak. We use a Redis Lua script. We don't actually run a background job to add tokens; instead, we calculate the tokens lazily upon the next request based on the time delta.`,
        codeExample: {
          id: 'tb-lua',
          language: 'python',
          title: 'Token Bucket Lua Script Execution',
          filename: 'app/token_bucket.py',
          code: `import time
from redis.asyncio import Redis

# Lua Script for atomic execution
TOKEN_BUCKET_SCRIPT = """
local key = KEYS[1]
local max_tokens = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = 1

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1])
local last_refill = tonumber(data[2])

if tokens == nil then
    tokens = max_tokens
    last_refill = now
else
    local time_passed = now - last_refill
    local new_tokens = math.floor(time_passed * refill_rate)
    
    if new_tokens > 0 then
        tokens = math.min(max_tokens, tokens + new_tokens)
        last_refill = now
    end
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('EXPIRE', key, math.ceil(max_tokens / refill_rate))
    return {1, tokens}
else
    return {0, tokens}
end
"""

async def check_token_bucket(redis: Redis, user_id: str, capacity: int, refill_rate: float) -> bool:
    key = f"tb:{user_id}"
    now = time.time()
    
    # 1: allowed, 0: rate limited
    result = await redis.eval(
        TOKEN_BUCKET_SCRIPT, 
        1, key, 
        capacity, refill_rate, now
    )
    
    allowed = result[0] == 1
    return not allowed # return True if rate limited
`
        }
      },
      {
        id: 'concept-lb',
        type: 'concept',
        title: 'Leaky Bucket vs Token Bucket',
        content: `While Token Bucket allows bursts up to the capacity, Leaky Bucket strictly enforces a constant output rate.
        
In Leaky Bucket, requests are poured into the top of the bucket. If the bucket overflows, requests are dropped. But requests are only processed (drained from the bottom) at a strict, fixed rate. 
        
Leaky Bucket is often used in message queues or traffic shapers where you MUST protect a downstream system from receiving more than exactly X requests per second, regardless of how bursty the incoming traffic is. Token Bucket is preferred for public APIs because users expect fast responses and occasional bursts.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-tb',
        question: 'Why do we calculate tokens lazily in the Token Bucket algorithm instead of running a timer to add tokens?',
        answer: 'Running a global timer to refill buckets for millions of users would be incredibly resource-intensive. Lazy calculation computes the refill only when a user makes a request, based on the time elapsed since their last request. This makes the algorithm O(1) in both time and space per request.',
        difficulty: 'expert'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'redis-rate-limiting': {
    id: '09-05',
    slug: 'redis-rate-limiting',
    chapterId: 9,
    order: 5,
    title: 'Redis-Backed Rate Limiting in FastAPI',
    description: 'Build robust, production-grade rate limiting middleware with standards-compliant HTTP headers.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['09-04'],
    objectives: [
      'Build rate limiting as ASGI middleware',
      'Use Lua for atomic increment and check',
      'Add X-RateLimit headers to responses',
      'Return 429 with Retry-After header'
    ],
    sections: [
      {
        id: 'asgi-middleware',
        type: 'architecture',
        title: 'Middleware vs Dependencies for Rate Limiting',
        content: `In FastAPI, you can enforce rate limits via Route Dependencies (\`Depends()\`) or ASGI Middleware. 
        
Dependencies are excellent for granular, endpoint-specific limits (e.g., \`Depends(RateLimiter(calls=5, seconds=60))\`). However, if you want global limits (e.g., every IP is limited to 1000 req/min across the entire API), ASGI Middleware is much DRYer. Middleware runs before the routing logic, blocking abusive traffic before it even hits Pydantic validation, saving CPU cycles.
        
A production-ready rate limiter MUST return standard HTTP headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, and \`X-RateLimit-Reset\`. Furthermore, when blocking a request (HTTP 429), it should return a \`Retry-After\` header.`
      },
      {
        id: 'implementation-headers',
        type: 'implementation',
        title: 'Production Middleware Implementation',
        content: `Here is a complete ASGI middleware implementation using a Fixed Window in Redis, properly returning HTTP headers. We inject a Redis pool at startup to use within the middleware.`,
        codeExample: {
          id: 'rl-middleware',
          language: 'python',
          title: 'Rate Limit Middleware',
          filename: 'app/middleware.py',
          code: `import time
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from redis.asyncio import Redis

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis: Redis, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.redis = redis
        self.limit = limit
        self.window = window

    async def dispatch(self, request: Request, call_next):
        # Fallback to loopback if client host is missing
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        current_window = int(time.time() // self.window)
        key = f"rate_limit:ip:{client_ip}:{current_window}"
        
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.window + 1)
        res = await pipe.execute()
        
        count = res[0]
        remaining = max(0, self.limit - count)
        reset_time = (current_window + 1) * self.window
        
        headers = {
            "X-RateLimit-Limit": str(self.limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_time),
        }
        
        if count > self.limit:
            headers["Retry-After"] = str(reset_time - int(time.time()))
            return JSONResponse(
                status_code=429,
                content={"detail": "Too Many Requests"},
                headers=headers
            )
            
        # Call the next middleware/route
        response = await call_next(request)
        
        # Add headers to successful response
        for k, v in headers.items():
            response.headers[k] = v
            
        return response
`
        }
      }
    ],
    productionNotes: [
      {
        id: 'pn-rlm',
        severity: 'critical',
        content: 'When using ASGI Middleware for rate limiting, be aware that you cannot easily access user authentication state if your auth is handled via Route Dependencies. For authenticated user limits, stick to Dependencies or custom APIRouter classes.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'distributed-rate-limiting': {
    id: '09-06',
    slug: 'distributed-rate-limiting',
    chapterId: 9,
    order: 6,
    title: 'Distributed Rate Limiting',
    description: 'Ensure accurate rate limiting across multiple FastAPI instances running in Kubernetes or auto-scaling groups.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['09-05'],
    objectives: [
      'Verify rate limits work with multiple app instances',
      'Handle Redis connection failures gracefully',
      'Implement local rate limit pre-check for performance',
      'Monitor distributed rate limit accuracy'
    ],
    sections: [
      {
        id: 'distributed-problem',
        type: 'concept',
        title: 'The Multi-Instance Challenge',
        content: `When you deploy FastAPI behind a load balancer with multiple Uvicorn workers or Kubernetes pods, in-memory rate limiting (using Python dicts) fails entirely. If you have 5 pods and a limit of 100 req/min, a user could theoretically hit 500 req/min by balancing across pods.
        
Redis solves this by acting as a centralized state store. Because Redis is single-threaded and supports atomic operations (Lua scripts), it ensures that all FastAPI pods share the exact same counter state reliably.
        
However, introducing Redis means introducing a network call on EVERY single HTTP request. This adds latency (usually 1-3ms) and makes Redis a single point of failure.`
      },
      {
        id: 'fail-open',
        type: 'architecture',
        title: 'Failing Open Gracefully',
        content: `What happens if Redis goes down? Do you block all API traffic, or do you allow traffic but risk overload?
        
In most web architectures, we implement "Fail Open" for rate limiting. If Redis is unreachable, we log an error but allow the request through. The availability of the API is usually more critical than strict enforcement of rate limits, unless it is a highly expensive billing endpoint.`,
        codeExample: {
          id: 'fail-open-code',
          language: 'python',
          title: 'Fail-Open Rate Limiter',
          filename: 'app/safe_limiter.py',
          code: `import logging
from fastapi import HTTPException
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

async def safe_rate_limit_check(redis_pool, key, limit):
    try:
        # Atomic Lua script or pipeline check here
        res = await redis_pool.incr(key)
        if res > limit:
            raise HTTPException(status_code=429, detail="Rate Limit Exceeded")
    except RedisError as e:
        # Redis is down or unreachable
        logger.error(f"Redis unavailable for rate limiting: {e}")
        # FAIL OPEN: Allow the request to proceed
        return True`
        }
      },
      {
        id: 'local-cache',
        type: 'production',
        title: 'In-Memory Pre-checking (L1 Cache)',
        content: `To optimize the Redis bottleneck, huge systems implement a two-tier rate limit. The FastAPI pod maintains a very short-lived (e.g., 2 second) local cache. 
        
If a user is heavily abusing an endpoint and is already known to be blocked by Redis, the FastAPI pod caches that "blocked" state locally for a few seconds. For the next 2 seconds, the pod blocks the user immediately without even calling Redis, saving massive load on the Redis cluster during a DDoS attempt.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-dist',
        question: 'Why should we prefer "fail-open" for rate limiting in microservices?',
        answer: 'Failing open prioritizes system availability. If the rate limiting datastore (Redis) goes offline, failing closed would cause a complete API outage. While failing open risks temporary overloading, auto-scaling can often absorb the hit, keeping the product usable for paying customers.',
        difficulty: 'advanced'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'tiered-rate-limits': {
    id: '09-07',
    slug: 'tiered-rate-limits',
    chapterId: 9,
    order: 7,
    title: 'Tiered Rate Limits: IP, User, API Key',
    description: 'Implement complex defense-in-depth by stacking different limiters based on user tiers.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['09-05'],
    objectives: [
      'Apply different limits per user tier',
      'Stack IP + user rate limits for defense in depth',
      'Implement per-endpoint rate limits',
      'Build rate limit bypass for internal services'
    ],
    sections: [
      {
        id: 'stacking',
        type: 'concept',
        title: 'Defense in Depth',
        content: `In a production API, a single rate limit is rarely enough. Consider an authenticated API. If you only limit by User ID, an attacker could create 10,000 free accounts and bypass the limit. If you only limit by IP, a university campus sharing a single NAT IP gets entirely blocked because of one bad actor.
        
The solution is stacking limits. We enforce:
1. A generous Global IP limit (e.g., 2000 req/min) to prevent basic scraping.
2. A strict User ID limit based on their billing tier (Free: 60/min, Pro: 600/min).
3. Highly specific Endpoint limits (e.g., /ai-generate is max 5/min).`
      },
      {
        id: 'tiered-implementation',
        type: 'implementation',
        title: 'Implementing Tiered Dependencies',
        content: `We can create a dynamic FastAPI dependency factory that takes tier logic into account. Note how we stack multiple dependencies in the router.`,
        codeExample: {
          id: 'tiered-code',
          language: 'python',
          title: 'Tiered Rate Limiter Dependency',
          filename: 'app/tiered.py',
          code: `from fastapi import Depends, Request, HTTPException
from typing import Callable

# Mock dependencies
async def get_current_user():
    return {"id": "usr_123", "tier": "free"}

def RateLimiter(endpoint_cost: int = 1) -> Callable:
    async def dependency(
        request: Request,
        user: dict = Depends(get_current_user),
    ):
        # Define limits based on user tier
        tier_limits = {
            "free": 10,
            "pro": 100,
            "enterprise": 1000
        }
        
        limit = tier_limits.get(user["tier"], 10)
        
        # Generate a unique Redis key for this user + endpoint combination
        key = f"rate:user:{user['id']}:route:{request.url.path}"
        
        # Pseudo-code for Redis check
        # current_count = await redis.incrby(key, endpoint_cost)
        current_count = 5 # Mock
        
        if current_count > limit:
            raise HTTPException(status_code=429, detail="Upgrade tier for higher limits")
            
    return dependency
`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-tiered',
        scenario: 'The Shared NAT IP Problem',
        problem: 'Implemented strict IP-based rate limiting. An entire corporate office sharing a single public IP address got blocked because multiple employees were using the app simultaneously.',
        solution: 'Switched to tracking a hash of `IP + User-Agent` for unauthenticated endpoints, and relied entirely on User ID / API Key limits for authenticated endpoints.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'burst-handling-strategy': {
    id: '09-08',
    slug: 'burst-handling-strategy',
    chapterId: 9,
    order: 8,
    title: 'Burst Handling Strategy',
    description: 'Tune your algorithms to handle expected spikes without annoying your users.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['09-04'],
    objectives: [
      'Implement burst allowance in token bucket',
      'Set burst limits proportional to sustained rate',
      'Monitor burst usage patterns',
      'Tune burst parameters based on real traffic data'
    ],
    sections: [
      {
        id: 'burst-math',
        type: 'concept',
        title: 'Sustained Rate vs Burst Capacity',
        content: `When defining limits, you must decouple two variables: the sustained throughput and the maximum burst. 
        
If a user is allowed 60 requests per minute, that averages out to 1 request per second. If they build a dashboard that fires 5 requests simultaneously on page load, a strict 1-per-second limit will fail 4 of those requests.
        
Using a Token Bucket, you set the refill rate to 1 per second, but the bucket capacity (burst) to 15. The user can fire 15 concurrent requests instantly, emptying the bucket. But they must then wait 15 seconds to regain that full burst capacity, maintaining the long-term mathematical average.`
      },
      {
        id: 'burst-tuning',
        type: 'architecture',
        title: 'Tuning Parameters',
        content: `A good rule of thumb for REST APIs is setting the burst capacity to 10-20% of the long-term limit. 
        
If the limit is 1000 per hour:
- Refill rate: 0.27 tokens/second
- Burst capacity: 150 tokens.
        
This allows applications that queue up work or load complex UIs to function properly while strictly bounding long-term resource usage.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'rate-limit-monitoring': {
    id: '09-09',
    slug: 'rate-limit-monitoring',
    chapterId: 9,
    order: 9,
    title: 'Rate Limit Monitoring & Analytics',
    description: 'Observe, alert, and act upon rate limit rejections in production.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.prometheus],
    prerequisites: ['09-05'],
    objectives: [
      'Track rate limit rejections by identifier',
      'Alert on spike in 429 responses',
      'Identify and block abusive clients',
      'Tune rate limits based on p99 traffic patterns'
    ],
    sections: [
      {
        id: 'observability',
        type: 'concept',
        title: 'Why Monitor 429s?',
        content: `Rate limits are a core business metric. If legitimate users are constantly hitting 429 Too Many Requests, your limits are either too strict, or your frontend client is poorly optimized (e.g., missing debouncing, polling excessively).
        
If no one ever hits a rate limit, they might be too loose. Monitoring rate limits allows you to find the exact p99 usage pattern of your users and tune the limits mathematically rather than guessing.`
      },
      {
        id: 'prometheus',
        type: 'implementation',
        title: 'Exporting 429 Metrics to Prometheus',
        content: `You should expose Prometheus metrics from your FastAPI application tracking how many times rate limits are hit, tagged by the endpoint and the user tier (do NOT tag by user ID, as this causes high cardinality).`,
        codeExample: {
          id: 'prom-metrics',
          language: 'python',
          title: 'Prometheus Rate Limit Counter',
          filename: 'app/metrics.py',
          code: `from prometheus_client import Counter

# Counter for rate limit rejections
RATE_LIMIT_HITS = Counter(
    "api_rate_limit_exceeded_total",
    "Number of HTTP 429 responses",
    ["endpoint", "tier"]
)

# Inside your rate limiter dependency:
# if count > limit:
#     RATE_LIMIT_HITS.labels(endpoint=request.url.path, tier=user.tier).inc()
#     raise HTTPException(status_code=429)`
        }
      },
      {
        id: 'actionable',
        type: 'production',
        title: 'Building Feedback Loops',
        content: `Once metrics are in Grafana, set up alerts:
1. Sudden Spike Alert: If 429s jump by 500% in 5 minutes, it might be an ongoing attack or a broken partner integration. PagerDuty should notify on-call.
2. Chronic User Alert: If top-tier enterprise clients are hitting limits daily, Sales should be notified to upgrade them to a custom high-capacity plan.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  }
};
