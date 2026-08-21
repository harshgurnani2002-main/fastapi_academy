import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch13Lessons: Record<string, Lesson> = {
  'session-architecture': {
    id: '13-01',
    slug: 'session-architecture',
    chapterId: 13,
    order: 1,
    title: 'Session Architecture: Cookies vs Server-Side',
    description: 'Understand the architectural differences between signed cookie sessions and server-side session stores.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.redis],
    prerequisites: ['12-05'],
    objectives: [
      'Compare signed cookie vs server session trade-offs',
      'Understand session data size limits',
      'Choose session storage based on requirements',
      'Design session schema for your application'
    ],
    sections: [
      {
        id: 'sec-13-01-1',
        type: 'concept',
        title: 'State in a Stateless Protocol',
        content: `HTTP is inherently stateless, yet modern applications require persistent user sessions. To bridge this gap, applications must maintain state across requests. 
        
The two primary approaches to session management are **Client-Side Sessions** (Signed Cookies) and **Server-Side Sessions** (Session IDs with backing stores). While client-side sessions encode all session data directly into a signed cookie, server-side sessions store a cryptographically secure, random Session ID in the cookie, which acts as a lookup key for data residing on the server.
        
Choosing between these architectures fundamentally dictates your application's ability to revoke access, scale horizontally, and manage complex state. This lesson explores these tradeoffs to help you make informed architectural decisions.`
      },
      {
        id: 'sec-13-01-2',
        type: 'architecture',
        title: 'Client-Side vs Server-Side Data Flow',
        content: `With client-side sessions, the server serializes, signs, and often encrypts the session payload (like user ID and permissions) into a cookie. On subsequent requests, the server verifies the signature to ensure integrity. This eliminates the need for a database lookup, making it highly scalable and performant. However, you are limited by the cookie size limit (typically 4KB), and more critically, **you cannot forcefully revoke a session** before it expires because the server holds no state.

Conversely, server-side sessions store only an opaque identifier in the cookie. The actual session payload lives in a high-performance data store like Redis or Memcached. When a request arrives, the server extracts the Session ID, queries the data store, and retrieves the session data. This architecture allows unlimited session size and provides absolute control over session lifecycle, including instant revocation, multi-device management, and session analytics. The tradeoff is the added latency and operational overhead of maintaining the session data store.`
      },
      {
        id: 'sec-13-01-3',
        type: 'implementation',
        title: 'Defining a Session Schema',
        content: `Regardless of where the data lives, standardizing what constitutes a "session" is critical. A robust session schema should include not just the user's identity, but metadata necessary for security and audit purposes.`,
        codeExample: {
          id: 'code-13-01-1',
          language: 'python',
          title: 'Session Schema Definition',
          filename: 'schemas.py',
          code: `from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SessionMetadata(BaseModel):
    user_agent: str = Field(..., description="Browser/device identifier")
    ip_address: str = Field(..., description="Client IP address")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

class SessionData(BaseModel):
    user_id: int
    role: str
    session_id: str
    metadata: SessionMetadata
    requires_mfa: bool = False
    
    # Context-specific data that might change
    # e.g., active organization context, shopping cart ID
    organization_id: Optional[int] = None`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-01-1',
        question: 'Why might an organization choose server-side sessions over signed cookies despite the performance cost?',
        answer: 'Server-side sessions provide instant revocation capabilities, essential for security-critical applications (e.g., banking). If a user account is compromised, administrators can delete the session from the server store, immediately terminating access. Signed cookies cannot be reliably revoked before their expiration time without complex blocklisting mechanisms.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-13-01-2',
        question: 'What are the risks of storing complex objects in a signed cookie session?',
        answer: 'The primary risk is hitting the ~4KB cookie size limit, resulting in silent failures where the browser drops the cookie. Additionally, if the cookie is not encrypted (only signed), the data is visible to the client, leading to potential information disclosure. Finally, larger cookies increase the payload size of every HTTP request, degrading performance.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-01-1',
        severity: 'info',
        content: 'When migrating from client-side to server-side sessions, consider a hybrid approach during the transition: validate the client-side signature first, then backfill the session into the new server-side store to avoid logging out active users.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-01-1',
        title: 'Storing PII in Unencrypted Signed Cookies',
        description: 'Developers often confuse signing (integrity) with encryption (confidentiality). Storing email addresses or roles in a signed cookie exposes them to the user.',
        badCode: {
          id: 'bad-13-01-1',
          language: 'python',
          title: '❌ Visible to Client',
          code: `# The user can decode this base64 payload and see their role
session_cookie = sign_data({"user_id": 1, "role": "admin", "email": "user@company.com"})`
        },
        goodCode: {
          id: 'good-13-01-1',
          language: 'python',
          title: '✅ Opaque Identifier',
          code: `# Store only the ID; keep PII on the server
session_id = generate_secure_id()
redis.set(f"session:{session_id}", {"user_id": 1, "role": "admin", "email": "user@company.com"})
session_cookie = sign_data({"session_id": session_id})`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-01',
        title: 'Design a Hybrid Session Store',
        description: 'Design a system that uses short-lived signed cookies for performance, backed by a server-side store that manages the "true" session lifecycle and handles revocation.',
        hint: 'Think about how OAuth access tokens (short-lived) relate to refresh tokens (server-controlled). Apply a similar concept.',
        solution: 'The solution involves issuing a signed cookie with a very short TTL (e.g., 5 minutes) containing the user ID and a reference to the server-side session ID. On every request, validate the cookie. If it is expired or near expiration, verify the session ID against the server store. If valid, reissue the cookie. If the server session was revoked, reject the request.',
        solutionCode: {
          id: 'sol-13-01',
          language: 'python',
          title: 'Hybrid Validation Logic',
          filename: 'hybrid.py',
          code: `async def get_current_user(request: Request):
    cookie_payload = verify_signed_cookie(request.cookies.get("session"))
    
    # 1. Quick check: Is cookie valid and not expired?
    if cookie_payload and not is_near_expiration(cookie_payload):
        return cookie_payload["user_id"]
        
    # 2. Slow check: Validate against server store (Redis)
    session_id = cookie_payload["session_id"]
    server_session = await redis.get(f"session:{session_id}")
    
    if not server_session:
        raise HTTPException(status_code=401, detail="Session revoked")
        
    # 3. Reissue cookie if valid
    reissue_cookie(request, session_id, server_session["user_id"])
    return server_session["user_id"]`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-01',
        scenario: 'The 4KB Limit Incident',
        problem: 'An application stored user permissions in a signed cookie. As the product grew, users were assigned more permissions. Eventually, users in many groups exceeded the 4KB cookie limit, causing browsers to silently drop the cookie and resulting in inexplicable logout loops.',
        solution: 'Migrated to server-side sessions using Redis. The cookie now only holds a 32-byte session ID, while the extensive permissions list is loaded from Redis on demand and cached within the request context.'
      }
    ],
    codeExamples: [],
  },
  'redis-session-store': {
    id: '13-02',
    slug: 'redis-session-store',
    chapterId: 13,
    order: 2,
    title: 'Building a Redis Session Store',
    description: 'Implement a high-performance, distributed session store using Redis and FastAPI.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['13-01'],
    objectives: [
      'Store sessions as Redis hashes',
      'Implement sliding TTL on session access',
      'Namespace session keys correctly',
      'Handle Redis unavailability gracefully'
    ],
    sections: [
      {
        id: 'sec-13-02-1',
        type: 'concept',
        title: 'Redis for Session Management',
        content: `Redis is the de facto standard for server-side session storage due to its extreme performance, in-memory nature, and native support for key expiration (TTL). 
        
When building a Redis session store, we typically represent sessions as strings (JSON serialized) or Redis Hashes. JSON strings are simpler, but Hashes allow retrieving specific fields without deserializing the entire object. 
        
A critical requirement for user experience is the "sliding session"—the session expiration should extend automatically as long as the user remains active. We achieve this by updating the Redis TTL whenever the session is accessed.`
      },
      {
        id: 'sec-13-02-2',
        type: 'implementation',
        title: 'Implementing the Store Component',
        content: `Let's build a robust Redis session store. We'll use a class-based approach to encapsulate the logic, manage serialization, and handle namespaces.`,
        codeExample: {
          id: 'code-13-02-1',
          language: 'python',
          title: 'Redis Session Store',
          files: {
            'session/store.py': {
              language: 'python',
              code: `import json
import secrets
from typing import Optional
from redis.asyncio import Redis

class RedisSessionStore:
    def __init__(self, redis: Redis, prefix: str = "sess:", ttl: int = 3600):
        self.redis = redis
        self.prefix = prefix
        self.ttl = ttl

    def _generate_id(self) -> str:
        return secrets.token_urlsafe(32)

    def _key(self, session_id: str) -> str:
        return f"{self.prefix}{session_id}"

    async def create(self, data: dict) -> str:
        session_id = self._generate_id()
        key = self._key(session_id)
        
        # Serialize data and set with TTL in one atomic operation
        await self.redis.setex(
            key, 
            self.ttl, 
            json.dumps(data)
        )
        return session_id

    async def get(self, session_id: str) -> Optional[dict]:
        key = self._key(session_id)
        data = await self.redis.get(key)
        
        if not data:
            return None
            
        # Sliding session: Reset TTL on access
        await self.redis.expire(key, self.ttl)
        
        return json.loads(data)

    async def delete(self, session_id: str) -> bool:
        key = self._key(session_id)
        result = await self.redis.delete(key)
        return result > 0`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Request, Response, Depends
from redis.asyncio import Redis
from session.store import RedisSessionStore

app = FastAPI()
# In production, manage this connection carefully (e.g., lifespan events)
redis_client = Redis(host='localhost', port=6379, db=0)
session_store = RedisSessionStore(redis_client)

@app.post("/login")
async def login(response: Response):
    # Authenticate user...
    user_data = {"user_id": 123, "role": "admin"}
    
    # Create session in Redis
    session_id = await session_store.create(user_data)
    
    # Set cookie
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"message": "Logged in"}`
            }
          }
        }
      },
      {
        id: 'sec-13-02-3',
        type: 'architecture',
        title: 'Handling Redis Unavailability',
        content: `What happens to your application if Redis goes down? If session validation blocks on Redis, a Redis outage becomes a complete application outage.

To build resilient systems, you must handle ` + "`RedisError`" + ` gracefully. Options include:
1. **Fail Closed**: Reject the request. (Most secure, lowest availability).
2. **Fail Open (Limited)**: Allow the request if a secondary mechanism (like a short-lived signed JWT in the cookie) validates, but disable destructive actions.
3. **Local Cache Fallback**: Use an in-memory cache (like ` + "`cachetools`" + `) for recent session reads to survive short blips.

Always configure your Redis client with appropriate timeouts. A 5-second timeout on a session read will cripple your API latency during degradation.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-02-1',
        question: 'How do you prevent a high-traffic endpoint from overwhelming Redis with EXPIRE commands for sliding sessions?',
        answer: 'Instead of updating the TTL on every single read, we can implement probabilistic or throttled updates. For example, store a `last_accessed` timestamp in the session data. Only issue the EXPIRE command if `last_accessed` is more than 5 minutes old, reducing Redis write load significantly.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-13-02-2',
        question: 'Why is `secrets.token_urlsafe(32)` preferred over `uuid.uuid4()` for session IDs?',
        answer: 'UUIDv4 contains 122 bits of entropy. `token_urlsafe(32)` generates 32 bytes (256 bits) of random data, offering significantly higher entropy against brute-force attacks. Furthermore, UUIDs have a predictable format, whereas raw random bytes do not.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-02-1',
        severity: 'critical',
        content: 'Always set a strict socket timeout (e.g., `socket_timeout=0.5`) on your Redis connection for session management. If Redis becomes sluggish, you want the read to fail quickly rather than tying up FastAPI worker threads.'
      },
      {
        id: 'pn-13-02-2',
        severity: 'info',
        content: 'Use JSON serialization carefully. If your session data includes `datetime` objects, standard `json` will fail. Use `orjson` or a custom encoder.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-02-1',
        title: 'Not Namespacing Redis Keys',
        description: 'Using raw session IDs as keys can cause collisions with other application data stored in the same Redis instance, or make cache eviction policies difficult to tune.',
        badCode: {
          id: 'bad-13-02-1',
          language: 'python',
          title: '❌ Raw Keys',
          code: `await redis.set(session_id, data)`
        },
        goodCode: {
          id: 'good-13-02-1',
          language: 'python',
          title: '✅ Prefix Namespacing',
          code: `await redis.set(f"sess:{session_id}", data)`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-02',
        title: 'Implement Throttled Sliding Expiration',
        description: 'Modify the `get` method to only update the Redis TTL if more than 60 seconds have passed since the last update, minimizing write operations.',
        hint: 'You will need to store the last update time inside the session payload itself.',
        solution: 'Inject a `_last_ttl_update` timestamp into the session data upon creation and update. During read, check this timestamp before calling `expire`.',
        solutionCode: {
          id: 'sol-13-02',
          language: 'python',
          title: 'Throttled EXPIRE',
          filename: 'store.py',
          code: `import time

async def get(self, session_id: str) -> Optional[dict]:
    key = self._key(session_id)
    data_str = await self.redis.get(key)
    if not data_str:
        return None
        
    data = json.loads(data_str)
    current_time = int(time.time())
    
    # Only update TTL if 60 seconds have passed
    last_update = data.get('_last_ttl_update', 0)
    if current_time - last_update > 60:
        data['_last_ttl_update'] = current_time
        # Pipeline the update and expire
        async with self.redis.pipeline() as pipe:
            pipe.setex(key, self.ttl, json.dumps(data))
            await pipe.execute()
            
    return data`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-02',
        scenario: 'The Redis Memory Exhaustion',
        problem: 'An application failed to set TTLs on sessions created during an automated load test. Millions of orphaned session keys consumed all Redis memory, causing the eviction policy to randomly delete active production sessions.',
        solution: 'Enforced a strict `setex` policy in the wrapper class so a session cannot be created without a TTL. Additionally, separated session storage into a dedicated Redis logical database (db=1) to isolate it from application caching.'
      }
    ],
    codeExamples: [],
  },
  'session-rotation': {
    id: '13-03',
    slug: 'session-rotation',
    chapterId: 13,
    order: 3,
    title: 'Session Rotation & Fixation Prevention',
    description: 'Protect against session fixation and hijacking by rotating session identifiers at critical junctures.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['13-02'],
    objectives: [
      'Rotate session ID on every login',
      'Preserve session data across rotation',
      'Invalidate old session IDs immediately',
      'Understand the session fixation attack'
    ],
    sections: [
      {
        id: 'sec-13-03-1',
        type: 'concept',
        title: 'The Session Fixation Attack',
        content: `Session Fixation is an attack where an adversary tricks a victim into authenticating using a Session ID known to the attacker. 
        
The flow works like this:
1. Attacker visits the site and receives a valid, anonymous Session ID.
2. Attacker tricks the victim into clicking a link that forces the victim's browser to use the attacker's Session ID (e.g., via URL parameters or XSS setting the cookie).
3. The victim logs in. The server associates the victim's identity with that Session ID.
4. The attacker, who already has the Session ID, now has full access to the victim's authenticated account.

The primary defense against this is **Session Rotation**: The server must issue a brand new Session ID whenever a user's privilege level changes (most notably, upon login).`
      },
      {
        id: 'sec-13-03-2',
        type: 'implementation',
        title: 'Implementing Session Rotation',
        content: `To rotate a session, we must create a new session ID, copy the necessary data from the old session, destroy the old session in the store, and issue the new cookie to the client.`,
        codeExample: {
          id: 'code-13-03-1',
          language: 'python',
          title: 'Session Rotation Logic',
          files: {
            'session/store.py': {
              language: 'python',
              code: `class RedisSessionStore:
    # ... previous methods ...

    async def rotate(self, old_session_id: str) -> str:
        """
        Rotates the session ID, preserving data.
        Returns the new session ID.
        """
        old_key = self._key(old_session_id)
        data = await self.redis.get(old_key)
        
        if not data:
            # If old session doesn't exist, just create a new empty one
            return await self.create({})
            
        # Create new ID
        new_session_id = self._generate_id()
        new_key = self._key(new_session_id)
        
        # Use pipeline for atomicity
        async with self.redis.pipeline() as pipe:
            # Save data to new key
            pipe.setex(new_key, self.ttl, data)
            # Delete old key
            pipe.delete(old_key)
            await pipe.execute()
            
        return new_session_id`
            },
            'app/auth.py': {
              language: 'python',
              code: `from fastapi import APIRouter, Request, Response

router = APIRouter()

@router.post("/login")
async def login(request: Request, response: Response):
    # 1. Verify credentials...
    
    # 2. Get existing session ID (anonymous session)
    old_session_id = request.cookies.get("session_id")
    
    # 3. Rotate session to prevent fixation
    if old_session_id:
        new_session_id = await session_store.rotate(old_session_id)
    else:
        new_session_id = await session_store.create({})
        
    # 4. Update session with authenticated state
    session_data = await session_store.get(new_session_id)
    session_data["user_id"] = user.id
    session_data["authenticated"] = True
    await session_store.update(new_session_id, session_data)
    
    # 5. Issue new cookie
    response.set_cookie(
        key="session_id",
        value=new_session_id,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"status": "success"}`
            }
          }
        }
      },
      {
        id: 'sec-13-03-3',
        type: 'architecture',
        title: 'When to Rotate Sessions',
        content: `Login is the most critical time to rotate, but it's not the only one. Consider rotating sessions when:
- A user logs in (Anonymous -> Authenticated).
- A user logs out (Authenticated -> Anonymous).
- A user changes their password or updates critical security settings.
- A user escalates privileges (e.g., sudo mode, or switching to an Admin role).

Continuous rotation (rotating the ID on *every* request) is extremely secure but causes usability issues with concurrent requests (e.g., a page loading multiple async resources where the first request rotates the session, invalidating the subsequent requests before they arrive).`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-03-1',
        question: 'Explain how rotating a session ID prevents session fixation.',
        answer: 'In a fixation attack, the attacker relies on the victim authenticating against a session ID the attacker already knows. By rotating the session ID at the exact moment of authentication, the server discards the attacker-known ID and issues a new, secure ID to the victim. The attacker is left with an invalid, unauthenticated session ID.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-13-03-2',
        question: 'What race conditions can occur if you rotate session IDs too frequently, and how do you mitigate them?',
        answer: 'If multiple concurrent AJAX requests arrive and the first one rotates the session, the subsequent requests will carry the old, now-invalid session ID and fail. Mitigation strategies include allowing a brief grace period (e.g., 5 seconds) where the old session ID remains valid for read-only operations, or only rotating on explicit state changes (like login) rather than every request.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-03-1',
        severity: 'critical',
        content: 'When deleting the old session key during rotation, ensure it is completely removed from Redis. Using `RENAME` might seem efficient, but it bypasses the TTL update.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-03-1',
        title: 'Failing to Rotate on Logout',
        description: 'Just clearing the session data without changing the session ID allows an attacker who intercepted the ID to use it if the user ever logs back in.',
        badCode: {
          id: 'bad-13-03-1',
          language: 'python',
          title: '❌ Keeping the Same ID',
          code: `await session_store.update(session_id, {"authenticated": False})
# The session ID remains the same in the cookie`
        },
        goodCode: {
          id: 'good-13-03-1',
          language: 'python',
          title: '✅ Rotating on Logout',
          code: `await session_store.delete(session_id)
new_session_id = await session_store.create({})
response.set_cookie("session_id", new_session_id)`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-03',
        title: 'Implement a Grace Period for Rotation',
        description: 'Modify the rotation logic to allow the old session ID to remain valid for exactly 10 seconds to accommodate concurrent requests during rotation.',
        hint: 'Do not delete the old key immediately. Instead, modify its payload to point to the new session ID and set a very short TTL.',
        solution: 'When rotating, we set the old key to a special "tombstone" state containing a reference to the new session ID, and apply a 10-second TTL. If a subsequent concurrent request hits the tombstone, the store resolves it to the new session ID transparently.',
        solutionCode: {
          id: 'sol-13-03',
          language: 'python',
          title: 'Graceful Rotation',
          filename: 'store.py',
          code: `async def rotate(self, old_session_id: str) -> str:
    old_key = self._key(old_session_id)
    data = await self.redis.get(old_key)
    
    new_session_id = self._generate_id()
    new_key = self._key(new_session_id)
    
    tombstone = json.dumps({"_rotated_to": new_session_id})
    
    async with self.redis.pipeline() as pipe:
        # Create new session
        pipe.setex(new_key, self.ttl, data)
        # Leave tombstone for 10 seconds
        pipe.setex(old_key, 10, tombstone)
        await pipe.execute()
        
    return new_session_id
    
# In the get() method, check for the _rotated_to key 
# and recursively fetch the new session.`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-03',
        scenario: 'The Subdomain Cookie Trap',
        problem: 'An attacker found an XSS vulnerability on a marketing subdomain (blog.example.com). They used it to set a `session_id` cookie valid for `.example.com`. When users navigated to `app.example.com` and logged in, the application accepted the attacker-supplied ID, leading to account compromise.',
        solution: 'Implemented session rotation on login. Even though the attacker forced the initial session ID, the moment the user logged in at `app.example.com`, the server discarded it and issued a new, secure ID.'
      }
    ],
    codeExamples: [],
  },
  'multi-device-sessions': {
    id: '13-04',
    slug: 'multi-device-sessions',
    chapterId: 13,
    order: 4,
    title: 'Multi-Device Session Management',
    description: 'Design a system to track, list, and manage a users active sessions across multiple devices.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.postgresql, technologies.fastapi],
    prerequisites: ['13-02'],
    objectives: [
      'Store session metadata (device, IP, created)',
      'List all active sessions per user',
      'Enforce concurrent session limits',
      'Revoke specific device sessions'
    ],
    sections: [
      {
        id: 'sec-13-04-1',
        type: 'concept',
        title: 'The Challenge of Multi-Device Tracking',
        content: `Modern users expect to see a list of their active sessions (e.g., "MacBook Chrome in New York", "iPhone Safari in London") and have the ability to log out of specific devices remotely.

To enable this, a simple key-value lookup (` + "`sess:<session_id>`" + `) is insufficient. We need to be able to query all sessions belonging to a specific ` + "`user_id`" + `. In Redis, this requires maintaining a secondary index—typically a Redis Set associated with the user ID that stores the active Session IDs.`
      },
      {
        id: 'sec-13-04-2',
        type: 'implementation',
        title: 'Maintaining the User-to-Sessions Index',
        content: `Whenever a session is created, we must add its ID to the user's active sessions set. We must also capture client metadata (User-Agent, IP address) for display.`,
        codeExample: {
          id: 'code-13-04-1',
          language: 'python',
          title: 'User Session Indexing',
          files: {
            'session/manager.py': {
              language: 'python',
              code: `import json
from user_agents import parse # external library for parsing UA

class SessionManager:
    def __init__(self, redis):
        self.redis = redis

    def _user_set_key(self, user_id: int) -> str:
        return f"user:{user_id}:sessions"

    async def create_user_session(self, user_id: int, request: Request) -> str:
        session_id = generate_id()
        session_key = f"sess:{session_id}"
        
        # Parse device info
        ua_string = request.headers.get("user-agent", "")
        ua = parse(ua_string)
        device_name = f"{ua.os.family} {ua.browser.family}"
        ip_address = request.client.host
        
        session_data = {
            "user_id": user_id,
            "device": device_name,
            "ip": ip_address,
            "created_at": get_timestamp()
        }
        
        async with self.redis.pipeline() as pipe:
            # 1. Create the actual session
            pipe.setex(session_key, 86400, json.dumps(session_data))
            # 2. Add to the user's set of active sessions
            pipe.sadd(self._user_set_key(user_id), session_id)
            # 3. Ensure the set expires if unused (cleanup)
            pipe.expire(self._user_set_key(user_id), 86400 * 7)
            await pipe.execute()
            
        return session_id

    async def list_user_sessions(self, user_id: int) -> list[dict]:
        set_key = self._user_set_key(user_id)
        session_ids = await self.redis.smembers(set_key)
        
        active_sessions = []
        stale_ids = []
        
        # Fetch data for all session IDs
        for sid in session_ids:
            sid_str = sid.decode('utf-8')
            data = await self.redis.get(f"sess:{sid_str}")
            if data:
                parsed = json.loads(data)
                parsed["session_id"] = sid_str # inject ID for revocation
                active_sessions.append(parsed)
            else:
                # Session expired, mark for cleanup
                stale_ids.append(sid_str)
                
        # Clean up expired sessions from the set
        if stale_ids:
            await self.redis.srem(set_key, *stale_ids)
            
        return active_sessions`
            }
          }
        }
      },
      {
        id: 'sec-13-04-3',
        type: 'architecture',
        title: 'Enforcing Concurrent Limits',
        content: `Once we have an index of active sessions, enforcing concurrency limits (e.g., "Netflix plan allows 2 screens") becomes straightforward.

During session creation, before calling ` + "`sadd`" + `, we count the active sessions using ` + "`scard`" + `. If the limit is reached, we have two choices:
1. Reject the new login attempt ("Too many active devices").
2. Evict the oldest session (requires storing timestamps and sorting, or using a Redis Sorted Set instead of a standard Set).

Using a Redis Sorted Set (` + "`ZSET`" + `) keyed by ` + "`user_id`" + `, with the timestamp as the score, is the most robust approach for managing chronological session eviction.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-04-1',
        question: 'Why do we need to clean up `stale_ids` manually when listing user sessions?',
        answer: 'Redis expires the individual session key (`sess:<id>`) automatically based on its TTL. However, the Redis Set (`user:<id>:sessions`) that holds the references to those IDs does not automatically remove members when the referenced keys expire. This creates "dangling pointers." We clean them up on read to keep the set small and accurate.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-13-04-2',
        question: 'How would you reliably identify the device location (city/country) from the IP address?',
        answer: 'You integrate a GeoIP database (like MaxMind GeoIP2). During session creation, the FastAPI backend queries the database using the client IP to resolve the location. This metadata is then stored statically in the session payload in Redis. Avoid doing network requests to external GeoIP APIs during the critical login path to reduce latency.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-04-1',
        severity: 'warning',
        content: 'When parsing User-Agents, do not trust the string implicitly. It is client-provided and easily spoofed. Cap its length to prevent denial-of-service via massive header payloads.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-04-1',
        title: 'Synchronous Iteration over Session Keys',
        description: 'Using `KEYS sess:*` to find all sessions for a user will freeze a large Redis instance.',
        badCode: {
          id: 'bad-13-04-1',
          language: 'python',
          title: '❌ Blocking KEYS command',
          code: `# NEVER DO THIS IN PRODUCTION
all_keys = await redis.keys("sess:*")
for key in all_keys:
    data = await redis.get(key)
    if json.loads(data).get("user_id") == target_user:`
        },
        goodCode: {
          id: 'good-13-04-1',
          language: 'python',
          title: '✅ Using Secondary Index Sets',
          code: `# O(N) where N is user's active sessions (usually < 10)
session_ids = await redis.smembers(f"user:{user_id}:sessions")`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-04',
        title: 'Revoke Specific Device',
        description: 'Implement a `revoke_device(user_id, session_id)` method that ensures a user can only revoke their OWN sessions, not someone else\'s.',
        hint: 'You must verify that the session belongs to the user before deleting it, or rely on the user\'s session set.',
        solution: 'First, check if the session exists in the user\'s Set index. If it does, delete the session key and remove the ID from the Set.',
        solutionCode: {
          id: 'sol-13-04',
          language: 'python',
          title: 'Safe Revocation',
          filename: 'manager.py',
          code: `async def revoke_device(self, user_id: int, target_session_id: str) -> bool:
    set_key = self._user_set_key(user_id)
    
    # 1. Verify ownership securely using the set
    is_member = await self.redis.sismember(set_key, target_session_id)
    if not is_member:
        return False # Unauthorized or doesn't exist
        
    # 2. Delete both the actual session and the index reference
    async with self.redis.pipeline() as pipe:
        pipe.delete(f"sess:{target_session_id}")
        pipe.srem(set_key, target_session_id)
        await pipe.execute()
        
    return True`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-04',
        scenario: 'The Infinite Session List',
        problem: 'A bug in the client app caused it to request a new session ID on every app foreground event instead of resuming the old one. The user\'s Redis Set accumulated thousands of dangling session IDs. When the user visited the "Security Settings" page, fetching and parsing thousands of keys caused a timeout.',
        solution: 'Implemented a hard cap: a user can have a maximum of 50 concurrent sessions in their Set. If they exceed this, the oldest sessions are aggressively evicted. Also added the stale ID cleanup logic shown in the implementation section.'
      }
    ],
    codeExamples: [],
  },
  'logout-everywhere': {
    id: '13-05',
    slug: 'logout-everywhere',
    chapterId: 13,
    order: 5,
    title: 'Logout Everywhere & Session Invalidation',
    description: 'Implement robust mechanisms to terminate all active sessions atomically.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['13-04'],
    objectives: [
      'Invalidate all sessions atomically in Redis',
      'Handle JWT revocation alongside session deletion',
      'Implement logout all other devices',
      'Notify connected WebSocket clients on forced logout'
    ],
    sections: [
      {
        id: 'sec-13-05-1',
        type: 'concept',
        title: 'The Anatomy of a Global Logout',
        content: `When a user clicks "Log out of all devices" or when a password is reset, the system must immediately and definitively terminate all active sessions. 
        
Because we implemented a secondary index (the Redis Set tracking a user's active session IDs in the previous lesson), finding the sessions is easy. However, achieving atomicity and handling active connections (like WebSockets) requires careful orchestration.

There are two primary operations:
1. **Global Logout**: Delete all sessions, including the current one.
2. **Log out other devices**: Delete all sessions *except* the one currently making the request.`
      },
      {
        id: 'sec-13-05-2',
        type: 'implementation',
        title: 'Atomic Invalidation with Redis Pipelines',
        content: `We use Redis pipelines to ensure that if a user has 10 active sessions, we delete all 10 simultaneously, preventing a race condition where a request on another device slips through mid-logout.`,
        codeExample: {
          id: 'code-13-05-1',
          language: 'python',
          title: 'Global Revocation Logic',
          files: {
            'session/manager.py': {
              language: 'python',
              code: `class SessionManager:
    # ... previous methods ...

    async def logout_everywhere(self, user_id: int) -> int:
        """Logs out all devices and returns number of revoked sessions"""
        set_key = self._user_set_key(user_id)
        
        # 1. Get all session IDs
        session_ids = await self.redis.smembers(set_key)
        if not session_ids:
            return 0
            
        # 2. Build pipeline to delete everything atomically
        async with self.redis.pipeline() as pipe:
            # Delete individual session keys
            for sid in session_ids:
                pipe.delete(f"sess:{sid.decode('utf-8')}")
                
            # Delete the index set itself
            pipe.delete(set_key)
            
            # Execute all commands
            await pipe.execute()
            
        return len(session_ids)

    async def logout_others(self, user_id: int, current_session_id: str):
        """Logs out all devices EXCEPT the current one"""
        set_key = self._user_set_key(user_id)
        session_ids = await self.redis.smembers(set_key)
        
        target_ids = [
            sid.decode('utf-8') for sid in session_ids 
            if sid.decode('utf-8') != current_session_id
        ]
        
        if not target_ids:
            return
            
        async with self.redis.pipeline() as pipe:
            for sid in target_ids:
                pipe.delete(f"sess:{sid}")
                pipe.srem(set_key, sid) # Remove from set
            await pipe.execute()`
            }
          }
        }
      },
      {
        id: 'sec-13-05-3',
        type: 'architecture',
        title: 'Handling WebSocket Invalidation',
        content: `If a user is connected via a WebSocket, deleting the session in Redis does *not* automatically close the active TCP connection. The WebSocket server needs a mechanism to receive real-time notifications of session invalidation.

The standard pattern is to use **Redis Pub/Sub**. 
1. When ` + "`logout_everywhere`" + ` is called, publish a message to a ` + "`session_invalidated`" + ` channel containing the revoked Session IDs.
2. All FastAPI worker nodes subscribe to this channel.
3. When a node receives the message, it checks its local registry of active WebSocket connections. If it holds a connection for that Session ID, it forcefully closes the socket with a 4001 status code (Unauthorized).`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-05-1',
        question: 'If you use JWTs instead of Redis sessions, how do you implement "Logout Everywhere"?',
        answer: 'Since JWTs are stateless and cannot be deleted from a server, you must maintain a revocation list (blocklist) or store a "user_version" integer in the database. When a user logs out globally, increment the `user_version` in the DB. The JWT payload must contain the `version` it was issued with. On every request, compare the JWT version against the DB version. If they differ, reject the token.',
        difficulty: 'expert'
      },
      {
        id: 'iq-13-05-2',
        question: 'Why delete the entire Redis Set during `logout_everywhere` rather than iterating through and `srem`ing each member?',
        answer: 'Deleting the entire key via `DEL` is an O(1) operation (or O(N) for the number of elements being freed), whereas issuing multiple `SREM` commands is less efficient and leaves an empty key in Redis temporarily. Dropping the set entirely is faster and cleaner.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-05-1',
        severity: 'warning',
        content: 'When triggering a global logout due to a password change, remember to also revoke any active OAuth tokens or API keys associated with that user if your business logic demands complete credential rotation.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-05-1',
        title: 'Forgetting to clear the client cookie',
        description: 'Revoking the session on the server is correct, but failing to clear the cookie on the client results in the browser repeatedly sending invalid credentials.',
        badCode: {
          id: 'bad-13-05-1',
          language: 'python',
          title: '❌ Missing Cookie Clear',
          code: `@app.post("/logout")
async def logout(user=Depends(get_user)):
    await session_manager.logout_everywhere(user.id)
    return {"message": "Logged out"}`
        },
        goodCode: {
          id: 'good-13-05-1',
          language: 'python',
          title: '✅ Clearing the Cookie',
          code: `@app.post("/logout")
async def logout(response: Response, user=Depends(get_user)):
    await session_manager.logout_everywhere(user.id)
    response.delete_cookie("session_id")
    return {"message": "Logged out"}`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-05',
        title: 'Implement the User Version Pattern',
        description: 'Assume you cannot query the Redis secondary index (it is broken). Implement a fallback mechanism using a `security_stamp` (UUID) stored on the User database model to invalidate all sessions globally.',
        hint: 'The session payload must store the stamp it was created with.',
        solution: 'Add a `security_stamp` column to the User table. When creating a session, inject the current stamp into the session JSON. When validating a session, query the DB to ensure the session stamp matches the user stamp. To logout everywhere, simply generate a new UUID for the user\'s `security_stamp` in the DB.',
        solutionCode: {
          id: 'sol-13-05',
          language: 'python',
          title: 'Security Stamp Validation',
          filename: 'middleware.py',
          code: `async def validate_session(session_data: dict, db: Session):
    # Retrieve user from DB
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    
    # Compare stamps
    session_stamp = session_data.get("security_stamp")
    if user.security_stamp != session_stamp:
        # User's stamp was rotated (global logout occurred)
        # Destroy this invalidated session
        await redis.delete(f"sess:{session_data['id']}")
        raise HTTPException(status_code=401, detail="Session globally invalidated")
        
    return user`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-05',
        scenario: 'The Zombie WebSocket',
        problem: 'A user reported their account was hacked. The support team clicked "Force Logout". However, the attacker was connected via a real-time chat WebSocket. Because the WebSocket authentication only happened during the initial handshake, the attacker remained connected and continued sending messages for hours after the session was deleted from Redis.',
        solution: 'Implemented a background task that polls the session store every 60 seconds for all active WebSocket connections, forcibly severing connections if the underlying session ID no longer exists in Redis.'
      }
    ],
    codeExamples: [],
  },
  'session-security': {
    id: '13-06',
    slug: 'session-security',
    chapterId: 13,
    order: 6,
    title: 'Session Cookie Security',
    description: 'Configure HTTP cookies to protect session identifiers from XSS, CSRF, and network interception.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['13-01'],
    objectives: [
      'Set HttpOnly, Secure, SameSite on session cookies',
      'Use __Host- cookie prefix for additional security',
      'Set appropriate cookie domain and path',
      'Regenerate cookies on privilege escalation'
    ],
    sections: [
      {
        id: 'sec-13-06-1',
        type: 'concept',
        title: 'The Session Transport Mechanism',
        content: `Regardless of how perfectly you implement your Redis backend, if the session identifier (the cookie) is compromised in transit or in the browser, the attacker wins. 

Cookies have several security flags that dictate how the browser handles them. Understanding these flags is non-negotiable for web security.
- **HttpOnly**: Prevents JavaScript (e.g., XSS attacks) from reading the cookie.
- **Secure**: Ensures the cookie is only sent over encrypted HTTPS connections.
- **SameSite**: Controls whether the cookie is sent with cross-origin requests, forming the primary defense against Cross-Site Request Forgery (CSRF).`
      },
      {
        id: 'sec-13-06-2',
        type: 'implementation',
        title: 'Hardening FastAPI Cookies',
        content: `Let's configure a highly secure session cookie in FastAPI. We will also utilize the \`__Host-\` cookie prefix. 

The \`__Host-\` prefix is a browser convention. If a cookie name starts with \`__Host-\`, the browser enforces strict rules: the cookie *must* have the Secure flag, *must not* specify a Domain (binding it exclusively to the exact origin, not subdomains), and *must* have the Path set to \`/\`.`,
        codeExample: {
          id: 'code-13-06-1',
          language: 'python',
          title: 'Secure Cookie Configuration',
          files: {
            'app/config.py': {
              language: 'python',
              code: `from pydantic_settings import BaseSettings

class SecuritySettings(BaseSettings):
    # Set to False in local development without HTTPS
    COOKIE_SECURE: bool = True 
    # Prefix for maximum browser enforcement
    COOKIE_NAME: str = "__Host-session_id"
    # CSRF protection: 'lax' for typical sites, 'strict' for high security
    COOKIE_SAMESITE: str = "lax" 
    
settings = SecuritySettings()`
            },
            'app/auth.py': {
              language: 'python',
              code: `from fastapi import APIRouter, Response
from app.config import settings

router = APIRouter()

@router.post("/login")
async def login(response: Response):
    session_id = "generated_secure_id"
    
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=session_id,
        max_age=86400,          # 1 day in seconds
        httponly=True,          # BLOCK JavaScript access (XSS defense)
        secure=settings.COOKIE_SECURE, # HTTPS only
        samesite=settings.COOKIE_SAMESITE, # CSRF defense
        path="/",               # Required for __Host- prefix
        # domain MUST NOT be set when using __Host- prefix
    )
    return {"message": "Success"}`
            }
          }
        }
      },
      {
        id: 'sec-13-06-3',
        type: 'architecture',
        title: 'SameSite: Strict vs Lax vs None',
        content: `Choosing the right ` + "`SameSite`" + ` policy is critical.

- **Strict**: The cookie is *never* sent on cross-origin requests. If a user clicks a link to your site from an email or a different domain, they will appear logged out initially. Highly secure, but UX can suffer.
- **Lax**: The default in modern browsers. The cookie is not sent on cross-origin POST requests (preventing classic CSRF), but *is* sent on top-level navigations (like clicking a link via GET). This is the best balance for most applications.
- **None**: The cookie is sent on all requests. Requires the ` + "`Secure`" + ` flag. Only use this if you are building an embeddable widget or a third-party service.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-06-1',
        question: 'If a cookie is marked `HttpOnly`, does that fully protect the application against XSS?',
        answer: 'No. `HttpOnly` prevents an attacker from extracting the session ID via `document.cookie`. However, if an XSS vulnerability exists, the attacker can still execute malicious JavaScript that makes authenticated API requests on behalf of the user. The browser will automatically attach the `HttpOnly` cookie to these requests.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-13-06-2',
        question: 'What is the purpose of the `__Host-` prefix on a cookie name?',
        answer: 'The `__Host-` prefix forces the browser to apply strict security constraints. It prevents "cookie tossing" attacks where a malicious subdomain (e.g., `attacker.example.com`) sets a cookie for the parent domain (`.example.com`), potentially overriding the legitimate application cookie.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-06-1',
        severity: 'critical',
        content: 'When deploying behind a reverse proxy (Nginx, AWS ALB), ensure the proxy is passing the `X-Forwarded-Proto: https` header. Otherwise, FastAPI might think the request is HTTP and fail to process `Secure` cookies appropriately in certain middleware.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-06-1',
        title: 'Setting Wide Cookie Domains',
        description: 'Setting a domain like `.company.com` means the session cookie is sent to *every* subdomain. If any subdomain is compromised, the main application session is exposed.',
        badCode: {
          id: 'bad-13-06-1',
          language: 'python',
          title: '❌ Vulnerable Domain',
          code: `response.set_cookie("session", id, domain=".example.com")`
        },
        goodCode: {
          id: 'good-13-06-1',
          language: 'python',
          title: '✅ Host-Bound',
          code: `response.set_cookie("__Host-session", id, path="/") # Domain implicitly omitted`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-06',
        title: 'Conditional Cookie Security',
        description: 'Write a dependency that automatically sets `secure=True` only if the incoming request scheme is `https`.',
        hint: 'Inspect `request.url.scheme` or the `X-Forwarded-Proto` header.',
        solution: 'You can inspect the request to determine the protocol. This is useful for environments where developers test against localhost (HTTP) but deploy to HTTPS.',
        solutionCode: {
          id: 'sol-13-06',
          language: 'python',
          title: 'Dynamic Secure Flag',
          filename: 'deps.py',
          code: `from fastapi import Request

def is_secure_context(request: Request) -> bool:
    # Check actual scheme
    if request.url.scheme == "https":
        return True
        
    # Check proxy headers (ensure you trust your proxy!)
    forwarded_proto = request.headers.get("x-forwarded-proto", "").lower()
    if forwarded_proto == "https":
        return True
        
    return False

# Usage in route:
# secure_flag = is_secure_context(request)
# response.set_cookie(..., secure=secure_flag)`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-06',
        scenario: 'The Localhost Dev Nightmare',
        problem: 'A developer updated the session config to use `__Host-` and `Secure=True` and committed it. The entire engineering team found they couldn\'t log in locally because browsers drop `Secure` cookies over `http://localhost`, and `__Host-` strictly requires `Secure`.',
        solution: 'Modified the application startup to read a `ENVIRONMENT` environment variable. If `ENVIRONMENT=development`, the cookie prefix reverts to a standard name and `Secure` is set to `False`.'
      }
    ],
    codeExamples: [],
  },
  'distributed-session-patterns': {
    id: '13-07',
    slug: 'distributed-session-patterns',
    chapterId: 13,
    order: 7,
    title: 'Distributed Session Architecture Patterns',
    description: 'Scale session management across multiple servers and regions using Redis Cluster and replication.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['13-02'],
    objectives: [
      'Use Redis Cluster for distributed sessions',
      'Handle session data replication across regions',
      'Implement sticky sessions as fallback',
      'Monitor session store availability and latency'
    ],
    sections: [
      {
        id: 'sec-13-07-1',
        type: 'concept',
        title: 'Scaling Beyond a Single Redis Instance',
        content: `As your application scales horizontally with multiple FastAPI instances, having a single Redis server becomes a bottleneck and a single point of failure (SPOF). 
        
For enterprise-grade availability, sessions must be distributed. There are two main patterns:
1. **Redis Sentinel**: Provides High Availability (HA) via primary-replica failover, but does not partition the data. Best when session volume fits in memory on one machine but you need redundancy.
2. **Redis Cluster**: Shards the data automatically across multiple nodes, providing both HA and horizontal scalability. Essential for massive user bases where session data exceeds a single node's RAM.`
      },
      {
        id: 'sec-13-07-2',
        type: 'implementation',
        title: 'Using Redis Cluster in FastAPI',
        content: `Integrating Redis Cluster requires a different client configuration. We use ` + "`redis.asyncio.cluster.RedisCluster`" + ` which automatically discovers the cluster topology and routes requests to the correct shard based on the key's hash slot.`,
        codeExample: {
          id: 'code-13-07-1',
          language: 'python',
          title: 'Redis Cluster Configuration',
          files: {
            'session/cluster_store.py': {
              language: 'python',
              code: `from redis.asyncio.cluster import RedisCluster
import json

class DistributedSessionStore:
    def __init__(self, startup_nodes: list[dict]):
        # Connect to the cluster. The client will discover other nodes.
        self.redis = RedisCluster(startup_nodes=startup_nodes, decode_responses=False)
        self.ttl = 3600

    async def get_session(self, user_id: int, session_id: str):
        # NOTE: In a cluster, keys used in multi-key operations (like pipelines) 
        # MUST hash to the same slot. We use "hash tags" {} to enforce this.
        # By wrapping {user_id} in brackets, Redis only uses the user_id to calculate the shard.
        
        # Now, the session key and the user's active session set will live on the same physical node.
        session_key = f"sess:{{user_{user_id}}}:{session_id}"
        set_key = f"active_sessions:{{user_{user_id}}}"
        
        async with self.redis.pipeline() as pipe:
            pipe.get(session_key)
            pipe.expire(session_key, self.ttl)
            pipe.expire(set_key, self.ttl)
            results = await pipe.execute()
            
        data = results[0]
        return json.loads(data) if data else None`
            }
          }
        }
      },
      {
        id: 'sec-13-07-3',
        type: 'architecture',
        title: 'Multi-Region Session Replication',
        content: `If your application spans multiple geographic regions (e.g., US-East and EU-West), forcing all EU traffic to fetch sessions from a US-East Redis instance adds 100ms+ of latency to *every* request.

Active-Active Redis replication (like Redis Enterprise CRDTs or DynamoDB Global Tables) solves this. Sessions created in EU are asynchronously replicated to US. 
However, due to eventual consistency, a session might not be immediately available in US-East right after creation. 

To mitigate replication lag, applications often employ **Sticky Sessions** (via Load Balancer cookies), ensuring a user's requests route to the same region where their session was created, treating the cross-region replication purely as a disaster recovery fallback.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-07-1',
        question: 'Explain the concept of Redis Hash Tags ({}) and why they are mandatory when using Redis Cluster pipelines.',
        answer: 'Redis Cluster partitions data into 16,384 hash slots. When you execute a multi-key operation (like a pipeline or a LUA script), Redis requires that all keys involved belong to the exact same hash slot. By wrapping a substring of the key in curly braces, e.g., `user:{123}:session`, Redis only hashes the `123`. This guarantees that related keys are stored on the same physical node, allowing atomic multi-key operations.',
        difficulty: 'expert'
      },
      {
        id: 'iq-13-07-2',
        question: 'What is the "Thundering Herd" problem in relation to session expiration, and how do you prevent it?',
        answer: 'If thousands of sessions are set to expire at the exact same millisecond, Redis might spike in CPU while deleting them, and simultaneous database lookups might occur as users re-authenticate. To prevent this, add jitter (randomness) to the TTL. Instead of exactly 3600 seconds, use `3600 + random.randint(0, 300)`.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-07-1',
        severity: 'critical',
        content: 'When using Redis Cluster, be extremely careful with operations like `KEYS *`. They require querying every node in the cluster and aggregating the results, which is a massive performance bottleneck.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-07-1',
        title: 'Pipeline Failures in Cluster Mode',
        description: 'Attempting to pipeline keys that hash to different slots will result in a `CROSSSLOT` error at runtime.',
        badCode: {
          id: 'bad-13-07-1',
          language: 'python',
          title: '❌ CROSSSLOT Error',
          code: `# Fails because sess:123 and user:active might be on different shards
async with cluster.pipeline() as pipe:
    pipe.set("sess:123", data)
    pipe.sadd("user:active", "123")`
        },
        goodCode: {
          id: 'good-13-07-1',
          language: 'python',
          title: '✅ Hash Tags Ensure Colocation',
          code: `# Both keys hash using the common tag {u_456}
async with cluster.pipeline() as pipe:
    pipe.set("sess:{u_456}:123", data)
    pipe.sadd("user:{u_456}:active", "123")`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-07',
        title: 'Implement Jitter on Session TTL',
        description: 'Update the session creation logic to add up to 5 minutes of random jitter to the base TTL to prevent expiration spikes.',
        hint: 'Use the standard library `random.randint`.',
        solution: 'Calculate a randomized TTL during session creation and update.',
        solutionCode: {
          id: 'sol-13-07',
          language: 'python',
          title: 'TTL Jitter',
          filename: 'store.py',
          code: `import random

class SessionStore:
    def __init__(self, base_ttl=3600):
        self.base_ttl = base_ttl

    def get_jittered_ttl(self) -> int:
        # Add between 0 and 300 seconds of jitter
        jitter = random.randint(0, 300)
        return self.base_ttl + jitter

    async def create(self, data: dict):
        ttl = self.get_jittered_ttl()
        # Create session with jittered TTL
        await self.redis.setex(key, ttl, json.dumps(data))`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-07',
        scenario: 'The Regional Failover Outage',
        problem: 'A US-East AWS outage caused traffic to automatically fail over to US-West. However, the application used an active-passive Redis setup where US-West Redis was heavily lagged. All users were suddenly treated as unauthenticated, causing a massive login spike that overwhelmed the primary database.',
        solution: 'Implemented "Graceful Degradation": if the session store is completely unavailable or severely lagged, the system falls back to validating a secondary short-lived stateless JWT (embedded in a separate cookie) allowing read-only access while the infrastructure recovers.'
      }
    ],
    codeExamples: [],
  },
  'session-analytics': {
    id: '13-08',
    slug: 'session-analytics',
    chapterId: 13,
    order: 8,
    title: 'Session Analytics & Security Monitoring',
    description: 'Monitor session activity to detect anomalies, IP address changes, and suspicious behavior.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.redis, technologies.postgresql, technologies.fastapi],
    prerequisites: ['13-04'],
    objectives: [
      'Track session activity metadata',
      'Detect IP address changes mid-session',
      'Alert on concurrent sessions from distant locations',
      'Implement step-up authentication for suspicious sessions'
    ],
    sections: [
      {
        id: 'sec-13-08-1',
        type: 'concept',
        title: 'Beyond Storage: Sessions as Security Context',
        content: `A session is not just a mechanism to remember who is logged in; it is an ongoing behavioral footprint. By analyzing the metadata attached to a session on every request, we can detect and intercept account takeover attempts in real time.

Common anomaly detection heuristics include:
- **IP Velocity**: The session IP address changes to a country thousands of miles away in a matter of minutes (Impossible Travel).
- **Session Hijacking**: The session identifier is used, but the User-Agent abruptly changes from Chrome/Mac to Firefox/Windows.
- **Concurrent Anomalies**: The same user account has active sessions originating from different geographic regions simultaneously.`
      },
      {
        id: 'sec-13-08-2',
        type: 'implementation',
        title: 'Middleware for Anomaly Detection',
        content: `We can implement a FastAPI dependency or middleware that intercepts the session read, compares the current request context against the stored session metadata, and triggers alerts or defensive actions if anomalies are detected.`,
        codeExample: {
          id: 'code-13-08-1',
          language: 'python',
          title: 'Anomaly Detection Dependency',
          files: {
            'session/security.py': {
              language: 'python',
              code: `from fastapi import Request, HTTPException, Security
import logging

logger = logging.getLogger(__name__)

async def verify_session_integrity(request: Request, session_data: dict = Security(get_session)):
    current_ip = request.client.host
    original_ip = session_data.get("metadata", {}).get("ip_address")
    
    current_ua = request.headers.get("user-agent")
    original_ua = session_data.get("metadata", {}).get("user_agent")
    
    # Heuristic 1: Sudden User-Agent change (Strong indicator of cookie theft)
    if current_ua != original_ua:
        logger.warning(f"Session {session_data['session_id']} hijacked? UA changed.")
        # Defensive Action: Destroy session immediately
        await session_store.delete(session_data['session_id'])
        raise HTTPException(status_code=401, detail="Session invalid")
        
    # Heuristic 2: IP Address change
    if current_ip != original_ip:
        # IPs change legitimately (e.g., switching from WiFi to Cellular)
        # We don't drop the session, but we might trigger Step-Up Auth
        logger.info(f"IP changed for session {session_data['session_id']}")
        
        if not session_data.get("requires_mfa"):
            # Update session to force MFA on next sensitive action
            session_data["requires_mfa"] = True
            session_data["mfa_reason"] = "ip_change"
            await session_store.update(session_data['session_id'], session_data)
            
    return session_data`
            }
          }
        }
      },
      {
        id: 'sec-13-08-3',
        type: 'architecture',
        title: 'Step-Up Authentication',
        content: `When an anomaly is detected (like an IP change), instantly logging the user out is terrible for UX (especially for mobile users switching networks). 

Instead, implement **Step-Up Authentication**. You mark the session as ` + "`requires_mfa = True`" + ` in Redis. The user can continue browsing read-only pages. However, if they attempt a sensitive action (like changing a password or transferring funds), the system checks the ` + "`requires_mfa`" + ` flag and intercepts the request, redirecting them to enter an OTP or biometric prompt. Once successful, the flag is cleared.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-08-1',
        question: 'How do you detect "Impossible Travel" without blocking legitimate VPN users?',
        answer: 'Impossible travel calculates the geographic distance between two IPs and checks if the time elapsed makes the travel possible. VPNs trigger false positives. To mitigate this, check the IPs against known commercial VPN/Proxy databases. If the new IP is a known VPN, you might lower the risk score or opt for Step-Up Auth rather than a hard block.',
        difficulty: 'expert'
      },
      {
        id: 'iq-13-08-2',
        question: 'Why is comparing User-Agents a reliable defense against naive session hijacking?',
        answer: 'When attackers steal a session cookie via XSS, they often replay it using automated scripts (like curl or python-requests) or their own browser. Unless they specifically crafted the attack to copy the victim\'s exact User-Agent string, the mismatch is instantly detectable.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-08-1',
        severity: 'warning',
        content: 'Be careful relying solely on `request.client.host`. If your FastAPI app is behind a Load Balancer or WAF, this will always be the internal IP. Ensure `ForwardedAllowIPs` is configured in Uvicorn so it correctly parses the `X-Forwarded-For` header.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-08-1',
        title: 'Logging PII in Security Events',
        description: 'Dumping the entire session payload into application logs during anomaly detection can violate compliance (GDPR/SOC2) by exposing emails or IDs in plain text logs.',
        badCode: {
          id: 'bad-13-08-1',
          language: 'python',
          title: '❌ Logging PII',
          code: `logger.warning(f"Anomaly for user {session['email']} with data {session}")`
        },
        goodCode: {
          id: 'good-13-08-1',
          language: 'python',
          title: '✅ Logging Opaque Identifiers',
          code: `logger.warning(f"Anomaly detected for user_id={session['user_id']}, event=ip_change")`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-08',
        title: 'Implement a Sensitive Route Protector',
        description: 'Create a FastAPI dependency `require_verified_session` that blocks access if the session has `requires_mfa=True`.',
        hint: 'This dependency should build on top of your standard `get_session` dependency.',
        solution: 'Chain dependencies. Extract the session, check the flag, and raise a 403 Forbidden with a specific error code prompting the frontend to display an MFA dialog.',
        solutionCode: {
          id: 'sol-13-08',
          language: 'python',
          title: 'MFA Enforcement Dependency',
          filename: 'deps.py',
          code: `from fastapi import Depends, HTTPException

async def require_verified_session(session_data: dict = Depends(verify_session_integrity)):
    if session_data.get("requires_mfa") is True:
        raise HTTPException(
            status_code=403, 
            detail={
                "code": "mfa_required",
                "message": "Please verify your identity to continue.",
                "reason": session_data.get("mfa_reason")
            }
        )
    return session_data
    
# Usage:
# @app.post("/transfer", dependencies=[Depends(require_verified_session)])`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-08',
        scenario: 'The Silent Cookie Theft',
        problem: 'A zero-day XSS exploit in a third-party chat widget allowed an attacker to silently exfiltrate session cookies of support agents. The attacker then used these cookies from Eastern Europe to access the admin panel and export customer data.',
        solution: 'Implemented IP-binding for high-privilege administrative sessions. If the IP changes even slightly for an Admin session, the session is instantly destroyed (no step-up auth, just hard termination).'
      }
    ],
    codeExamples: [],
  },
  'jwt-vs-sessions': {
    id: '13-09',
    slug: 'jwt-vs-sessions',
    chapterId: 13,
    order: 9,
    title: 'JWT vs Sessions: The Production Decision',
    description: 'A comprehensive comparison of stateful sessions versus stateless JWTs for real-world API authentication.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.jwt, technologies.redis],
    prerequisites: ['13-01'],
    objectives: [
      'List the real trade-offs of JWTs vs sessions',
      'Evaluate statefulness requirements',
      'Implement hybrid approaches',
      'Explain your choice in system design interviews'
    ],
    sections: [
      {
        id: 'sec-13-09-1',
        type: 'concept',
        title: 'The Great Debate: Stateful vs Stateless',
        content: `The debate between Server-Side Sessions (Stateful) and JSON Web Tokens (Stateless) is one of the most persistent in web engineering.

**Server-Side Sessions** store data on the server (Redis). 
*Pros*: Immediate revocation, easy session management (list active devices, force logout), invisible payload to client, no size limits.
*Cons*: Requires a database lookup on every request, creating a central bottleneck.

**JWTs (JSON Web Tokens)** encode data directly into the token cryptographically.
*Pros*: Zero database lookups to validate authentication, making them incredibly fast and infinitely scalable across microservices.
*Cons*: **Impossible to revoke before expiration** (without adding state back in), payload is visible (base64 encoded), and larger payload sizes.`
      },
      {
        id: 'sec-13-09-2',
        type: 'architecture',
        title: 'The Revocation Problem',
        content: `The fatal flaw of pure JWT authentication in user-facing applications is revocation. If a user's token is compromised, or if an administrator bans a user, the JWT remains mathematically valid until its \`exp\` (expiration) time is reached.

To fix this, developers often introduce a "JWT Blocklist" in Redis. When a token is revoked, its ID (jti) is added to Redis. On every request, the server checks the blocklist. 

**The Irony**: By introducing a blocklist, you have made the stateless JWT stateful again. You are now doing a Redis lookup on every request, entirely negating the primary performance benefit of JWTs, while keeping all the downsides (larger payload, complexity).`
      },
      {
        id: 'sec-13-09-3',
        type: 'implementation',
        title: 'The Hybrid Approach: Short-lived JWT + Stateful Refresh',
        content: `For microservice architectures where passing session data between services is cumbersome, the standard pattern is the Hybrid Approach.

1. **Authentication Service**: Manages stateful sessions (Refresh Tokens) in a database.
2. **Access Token (JWT)**: Issued with a very short lifespan (e.g., 5 to 15 minutes).
3. **API Gateway / Microservices**: Validate the JWT statelessly (fast, no DB lookup).

If a token is compromised, the attacker has at most 15 minutes of access. When the JWT expires, the client uses the Refresh Token to get a new JWT. This request hits the Authentication Service, which checks the database state. If the user was banned, it denies the refresh.`,
        codeExample: {
          id: 'code-13-09-1',
          language: 'python',
          title: 'Hybrid Architecture Flow',
          files: {
            'docs/architecture.md': {
              language: 'markdown',
              code: `
1. Client logs in via Auth Service.
2. Auth Service creates a Long-Lived Refresh Session in Redis (Stateful).
3. Auth Service generates a 5-minute Access JWT (Stateless).
4. Client sends JWT to Resource Microservice.
5. Microservice validates JWT signature mathematically (CPU only, 0 network latency).
6. JWT expires after 5 minutes.
7. Client silently requests a new JWT using the Refresh Session.
8. Auth Service queries Redis. If active, issues new JWT.`
            }
          }
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-13-09-1',
        question: 'When should you absolutely use Server-Side Sessions over JWTs?',
        answer: 'For monolithic applications (like a single FastAPI backend with server-rendered templates or a standard SPA), Server-Side Sessions are almost always superior. They provide out-of-the-box immediate revocation and multi-device management without the architectural complexity of JWT refresh flows.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-13-09-2',
        question: 'If JWTs are stateless, how do microservices know the secret key to verify the signature?',
        answer: 'Microservices can share a symmetric key (HMAC), but this is risky. The production standard is asymmetric cryptography (RSA). The Auth service signs the token with a Private Key. Microservices fetch the Auth service\'s Public Key (often via a JWKS endpoint) and cache it. They use the public key to verify signatures without needing to communicate with the Auth service for every request.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-13-09-1',
        severity: 'info',
        content: 'Do not use JWTs for standard web application sessions unless you are explicitly building a decoupled microservice architecture. Redis sessions are vastly simpler and more secure for monoliths.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-13-09-1',
        title: 'Long-Lived Access Tokens',
        description: 'Issuing a JWT with a 30-day expiration time without any revocation mechanism means a stolen token grants unfettered access for a month.',
        badCode: {
          id: 'bad-13-09-1',
          language: 'python',
          title: '❌ Dangerous Lifespan',
          code: `jwt.encode({"sub": user_id, "exp": datetime.utcnow() + timedelta(days=30)}, SECRET)`
        },
        goodCode: {
          id: 'good-13-09-1',
          language: 'python',
          title: '✅ Short Lifespan',
          code: `jwt.encode({"sub": user_id, "exp": datetime.utcnow() + timedelta(minutes=15)}, SECRET)`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-13-09',
        title: 'Architectural Decision Record (ADR)',
        description: 'Write a brief Architectural Decision Record justifying the move from pure JWTs to Redis Sessions for a monolithic e-commerce application.',
        hint: 'Focus on the business requirements of immediately revoking access when a credit card fraud alert is triggered.',
        solution: 'Title: Migrate to Redis Sessions. Context: We currently use JWTs valid for 24 hours. Fraud operations require the ability to instantly lock compromised accounts. Revoking JWTs requires a blocklist, adding stateful lookups. Decision: Switch to Redis sessions. The monolith already has a Redis instance for caching. We accept a minor latency hit (sub-millisecond Redis read) in exchange for absolute control over session termination and the ability to implement forced logouts.',
        solutionCode: {
          id: 'sol-13-09',
          language: 'markdown',
          title: 'ADR Draft',
          filename: 'adr-001.md',
          code: `## Decision: Migrate from JWT to Redis Sessions

**Context**: Fraud team needs instant revocation capabilities. Current 24h JWTs prevent this.
**Alternatives Considered**: JWT Blocklist (rejected due to complexity/reinventing sessions).
**Decision**: Implement Redis-backed opaque session cookies.
**Consequences**: 
- (+) Instant revocation capability.
- (+) Ability to build "Active Devices" UI.
- (-) ~1ms added latency per request for Redis read.
- (-) Requires persistent Redis HA setup.`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-13-09',
        scenario: 'The JWT Size Limit',
        problem: 'An enterprise application stored user permissions in the JWT payload. Some users belonged to hundreds of groups. The JWT size swelled to 12KB, exceeding the maximum HTTP header size supported by their Nginx ingress controller, causing immediate 400 Bad Request errors for power users.',
        solution: 'Moved to an opaque Session ID model. The JWT now only contains the `user_id`, reducing it to ~300 bytes. Permissions are fetched from the database/cache upon request processing.'
      }
    ],
    codeExamples: [],
  }
};
