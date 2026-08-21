import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch25Lessons: Record<string, Lesson> = {
  'saas-architecture-design': {
    id: '25-01',
    slug: 'saas-architecture-design',
    chapterId: 25,
    order: 1,
    title: 'SaaS Architecture Design & Planning',
    description: 'Design a scalable, production-ready SaaS architecture for FastAPI.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['24-05'],
    objectives: [
      'Document system requirements and constraints',
      'Design the data model and service boundaries',
      'Choose technology stack with justification',
      'Create architecture diagram with all components'
    ],
    sections: [
      {
        id: 'capstone-arch-concept',
        type: 'concept',
        title: 'Architecting for SaaS at Scale',
        content: `Building a SaaS application requires designing for multi-tenancy, high availability, and horizontal scalability from day one. In this capstone, we will build "TaskFlow", a project management SaaS. We must decide how to isolate tenant data, route requests efficiently, and ensure resilience across the entire stack.

A typical FastAPI SaaS architecture involves a load balancer (Nginx/Traefik) terminating TLS, routing to multiple API instances. The API communicates with a primary PostgreSQL database for persistence, Redis for caching and session management, and Celery workers for background tasks. We also need to integrate robust observability using OpenTelemetry, Prometheus, and Grafana.

Our design philosophy will be API-first. The backend will be entirely decoupled from the frontend, exposing a RESTful API that adheres strictly to OpenAPI specifications. We will use Domain-Driven Design (DDD) principles to organize our multi-file project, keeping concerns like authentication, billing, and core business logic cleanly separated.`
      },
      {
        id: 'capstone-arch-implementation',
        type: 'architecture',
        title: 'Service Boundaries & Data Flow',
        content: `Let's define the primary domains of our application. We have the Identity domain (users, auth, tenants), the Core domain (tasks, projects), and the Analytics domain. 

By separating these domains at the service or module level, we make it easier to extract them into microservices later if needed. For now, a modular monolith is the most pragmatic approach. All modules will live within the same FastAPI application but will have strict boundaries, interacting only through defined service interfaces, not directly via database queries.`,
        codeExample: {
          id: 'arch-structure',
          title: 'Modular Monolith Layout',
          language: 'python',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI\nfrom app.core.config import settings\nfrom app.api.v1.api import api_router\n\napp = FastAPI(title="TaskFlow API", version="1.0.0")\napp.include_router(api_router, prefix=settings.API_V1_STR)`
            },
            'app/domains/identity/services.py': {
              language: 'python',
              code: `class TenantService:\n    def __init__(self, db_session):\n        self.db = db_session\n\n    async def create_tenant(self, name: str, owner_id: int):\n        # Implementation for creating a new tenant workspace\n        pass`
            }
          }
        }
      },
      {
        id: 'capstone-arch-production',
        type: 'production',
        title: 'Database Multi-Tenancy Strategy',
        content: `For multi-tenancy in PostgreSQL, there are three main approaches: database-per-tenant, schema-per-tenant, or row-level multi-tenancy (shared tables). 

For a typical B2B SaaS scaling up to thousands of tenants, row-level multi-tenancy with a \`tenant_id\` column on every table is often the most cost-effective and operationally simple starting point. We will combine this with PostgreSQL Row-Level Security (RLS) to enforce isolation at the database engine level, preventing application bugs from leaking data between tenants.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'arch-challenge-1',
        title: 'Design the Tenant Data Model',
        description: 'Create SQLAlchemy models for `Tenant`, `User`, and a linking table `TenantMember` that supports roles.',
        hint: 'Use a many-to-many relationship with an association table to store the role.',
        solution: 'Detailed solution with SQLAlchemy models.',
        solutionCode: {
          id: 'sol-arch-1',
          language: 'python',
          title: 'Tenant Models',
          filename: 'models.py',
          code: `from sqlalchemy import Column, Integer, String, ForeignKey, Enum\nfrom sqlalchemy.orm import relationship\nfrom app.db.base_class import Base\n\nclass Tenant(Base):\n    id = Column(Integer, primary_key=True)\n    name = Column(String, nullable=False)\n    members = relationship("TenantMember", back_populates="tenant")\n\nclass User(Base):\n    id = Column(Integer, primary_key=True)\n    email = Column(String, unique=True, nullable=False)\n    memberships = relationship("TenantMember", back_populates="user")\n\nclass TenantMember(Base):\n    tenant_id = Column(Integer, ForeignKey('tenant.id'), primary_key=True)\n    user_id = Column(Integer, ForeignKey('user.id'), primary_key=True)\n    role = Column(String, default="member")  # e.g., admin, member\n    tenant = relationship("Tenant", back_populates="members")\n    user = relationship("User", back_populates="memberships")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-arch-1',
        question: 'Why choose a modular monolith over microservices for a new SaaS product?',
        answer: 'A modular monolith reduces operational complexity, simplifies deployments, and avoids the network overhead of distributed systems while still enforcing clean boundaries. It allows the team to move fast initially and extract microservices later if scaling bottlenecks arise.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-arch-2',
        question: 'How do you prevent cross-tenant data leakage in a shared database architecture?',
        answer: 'Beyond application-level checks, using PostgreSQL Row-Level Security (RLS) policies ensures that even if a developer forgets to add a `WHERE tenant_id = X` clause, the database itself will prevent unauthorized access based on the current database session context.',
        difficulty: 'expert'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-arch-1',
        severity: 'critical',
        content: 'Always mandate a tenant_id on all core domain models and enforce its inclusion in all database queries to prevent data leaks.'
      }
    ]
  },
  'project-setup-infrastructure': {
    id: '25-02',
    slug: 'project-setup-infrastructure',
    chapterId: 25,
    order: 2,
    title: 'Project Setup & Infrastructure as Code',
    description: 'Set up the project repository, Docker, and CI/CD pipelines.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.docker, technologies.github_actions],
    prerequisites: ['25-01'],
    objectives: [
      'Initialize monorepo with Makefile and scripts',
      'Write Docker Compose for local development',
      'Configure CI/CD pipeline with GitHub Actions',
      'Set up pre-commit hooks and code quality tools'
    ],
    sections: [
      {
        id: 'infra-concept',
        type: 'concept',
        title: 'Infrastructure as Code Foundations',
        content: `A solid infrastructure foundation enables rapid iteration and reduces "it works on my machine" issues. By containerizing the development environment with Docker Compose, we ensure every developer runs the exact same versions of PostgreSQL, Redis, and Python.

Furthermore, we must automate code quality checks. Pre-commit hooks format code with Black, lint with Ruff, and type-check with Mypy before changes even leave the developer's laptop. Our CI pipeline in GitHub Actions acts as the ultimate gatekeeper, running tests and building artifacts only when all checks pass.`
      },
      {
        id: 'infra-implementation',
        type: 'implementation',
        title: 'Docker Compose Local Setup',
        content: `Our \`docker-compose.yml\` will define the API service alongside backing stores. We mount the local code directory as a volume for the API service to enable hot-reloading with Uvicorn.`,
        codeExample: {
          id: 'docker-compose-example',
          title: 'Local Development Environment',
          language: 'yaml',
          filename: 'docker-compose.yml',
          code: `version: '3.8'\nservices:\n  api:\n    build:\n      context: .\n      dockerfile: Dockerfile.dev\n    volumes:\n      - .:/app\n    ports:\n      - "8000:8000"\n    environment:\n      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/taskflow\n      - REDIS_URL=redis://redis:6379/0\n    depends_on:\n      - db\n      - redis\n  \n  db:\n    image: postgres:15-alpine\n    environment:\n      - POSTGRES_USER=postgres\n      - POSTGRES_PASSWORD=postgres\n      - POSTGRES_DB=taskflow\n    ports:\n      - "5432:5432"\n\n  redis:\n    image: redis:7-alpine\n    ports:\n      - "6379:6379"`
        }
      },
      {
        id: 'infra-cicd',
        type: 'production',
        title: 'GitHub Actions Pipeline',
        content: `Our CI pipeline runs on every pull request. It spins up required service containers, installs dependencies via Poetry or pip, runs the Pytest suite, and reports coverage. Notice how we use service containers in GitHub Actions to provide the database for integration tests.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'infra-challenge',
        title: 'Implement GitHub Actions CI',
        description: 'Write a basic GitHub Actions workflow that runs pytest with a PostgreSQL service container.',
        hint: 'Use the `services` keyword in the job definition.',
        solution: 'Here is the GitHub Actions workflow file.',
        solutionCode: {
          id: 'sol-infra-1',
          language: 'yaml',
          title: 'CI Workflow',
          filename: '.github/workflows/ci.yml',
          code: `name: CI\n\non: [push, pull_request]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    services:\n      postgres:\n        image: postgres:15\n        env:\n          POSTGRES_USER: user\n          POSTGRES_PASSWORD: password\n          POSTGRES_DB: testdb\n        ports:\n          - 5432:5432\n        options: >-\n          --health-cmd pg_isready\n          --health-interval 10s\n          --health-timeout 5s\n          --health-retries 5\n\n    steps:\n      - uses: actions/checkout@v3\n      - name: Set up Python\n        uses: actions/setup-python@v4\n        with:\n          python-version: '3.11'\n      - name: Install dependencies\n        run: pip install -r requirements.txt pytest\n      - name: Run tests\n        env:\n          DATABASE_URL: postgresql+asyncpg://user:password@localhost:5432/testdb\n        run: pytest`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-infra-1',
        question: 'Why use pre-commit hooks when you already have CI pipelines?',
        answer: 'Pre-commit hooks provide immediate feedback to developers, catching formatting and linting errors locally before a commit is even created. This saves CI compute resources and reduces the cycle time for fixing trivial issues.',
        difficulty: 'intermediate'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-infra-1',
        severity: 'warning',
        content: 'Do not bake secrets or .env files into your Docker images. Pass configuration at runtime via environment variables.'
      }
    ]
  },
  'authentication-implementation': {
    id: '25-03',
    slug: 'authentication-implementation',
    chapterId: 25,
    order: 3,
    title: 'Authentication System Implementation',
    description: 'Build a secure JWT and OAuth2 authentication system backed by Redis.',
    duration: 90,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.oauth2, technologies.jwt, technologies.redis],
    prerequisites: ['25-02'],
    objectives: [
      'Implement Google OAuth 2.0 with PKCE',
      'Build JWT access + refresh token system',
      'Implement Redis-backed session management',
      'Add MFA support with TOTP'
    ],
    sections: [
      {
        id: 'auth-concept',
        type: 'concept',
        title: 'Modern Auth Architecture',
        content: `A robust authentication system needs to handle standard email/password logins, social OAuth (like Google), and multi-factor authentication (MFA). 

While JWTs (JSON Web Tokens) are stateless and highly scalable, they cannot be instantly revoked. For a production SaaS, we mitigate this by using short-lived access tokens (e.g., 15 minutes) and long-lived refresh tokens stored securely in a Redis cluster. When a user logs out or is banned, we invalidate their refresh token in Redis, preventing them from obtaining new access tokens.`
      },
      {
        id: 'auth-implementation',
        type: 'implementation',
        title: 'OAuth2 with FastAPI Dependency Injection',
        content: `We will implement a custom dependency that verifies the JWT, checks if the user exists, and optionally checks for MFA completion.`,
        codeExample: {
          id: 'auth-deps',
          title: 'Authentication Dependencies',
          language: 'python',
          files: {
            'app/api/deps.py': {
              language: 'python',
              code: `from fastapi import Depends, HTTPException, status\nfrom fastapi.security import OAuth2PasswordBearer\nfrom app.core.security import verify_jwt\nfrom app.services.user import get_user_by_id\n\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")\n\nasync def get_current_user(token: str = Depends(oauth2_scheme)):\n    payload = verify_jwt(token)\n    if not payload:\n        raise HTTPException(\n            status_code=status.HTTP_401_UNAUTHORIZED,\n            detail="Invalid or expired token",\n        )\n    user = await get_user_by_id(payload["sub"])\n    if not user:\n        raise HTTPException(status_code=401, detail="User not found")\n    return user`
            }
          }
        }
      },
      {
        id: 'auth-production',
        type: 'production',
        title: 'Handling Refresh Tokens',
        content: `Refresh tokens should ideally be bound to a specific device/session footprint. When issuing a refresh token, store its hash in Redis with an expiration matching the token's lifetime. If a refresh token is reused suspiciously (Refresh Token Rotation), invalidate the entire session.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'auth-chal-1',
        title: 'Implement Redis Token Blacklist',
        description: 'Write a function to blacklist a JWT token in Redis until its expiration time.',
        hint: 'Use the Redis `SETEX` command using the token signature as the key.',
        solution: 'Extract expiration from token, calculate TTL, store in Redis.',
        solutionCode: {
          id: 'sol-auth-1',
          language: 'python',
          title: 'Token Blacklisting',
          filename: 'auth.py',
          code: `import jwt\nimport time\nfrom redis.asyncio import Redis\n\nasync def blacklist_token(token: str, redis: Redis, secret: str):\n    # Decode without verification to get exp time\n    payload = jwt.decode(token, options={"verify_signature": False})\n    exp = payload.get("exp")\n    if not exp:\n        return\n        \n    ttl = int(exp - time.time())\n    if ttl > 0:\n        # Store token footprint in Redis with TTL\n        await redis.setex(f"blacklist:{token}", ttl, "1")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-auth-1',
        question: 'What is the advantage of using Redis for session management over storing tokens in PostgreSQL?',
        answer: 'Redis operates entirely in memory, making token validation and revocation checks extremely fast (sub-millisecond latency). This is critical since authentication checks occur on almost every API request, which would otherwise heavily load the primary relational database.',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    productionNotes: [
      {
        id: 'pn-auth-1',
        severity: 'critical',
        content: 'Never store JWT secrets in your source code. Use a secure vault or environment variables managed by your cloud provider.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-auth-1',
        title: 'Infinite JWT Lifespans',
        description: 'Creating JWTs that never expire means if a token is stolen, the attacker has permanent access.',
        badCode: {
          id: 'bad-jwt',
          language: 'python',
          title: '❌ Bad',
          code: `jwt.encode({"sub": user.id}, SECRET_KEY)`
        },
        goodCode: {
          id: 'good-jwt',
          language: 'python',
          title: '✅ Good',
          code: `exp = datetime.utcnow() + timedelta(minutes=15)\njwt.encode({"sub": user.id, "exp": exp}, SECRET_KEY)`
        }
      }
    ]
  },
  'rbac-multi-tenancy': {
    id: '25-04',
    slug: 'rbac-multi-tenancy',
    chapterId: 25,
    order: 4,
    title: 'RBAC & Multi-Tenancy',
    description: 'Implement Role-Based Access Control and strict tenant isolation.',
    duration: 90,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['25-03'],
    objectives: [
      'Design multi-tenant data model',
      'Implement workspace-level RBAC',
      'Enforce data isolation at the database level',
      'Build tenant management API'
    ],
    sections: [
      {
        id: 'rbac-concept',
        type: 'concept',
        title: 'Workspace-Level Authorization',
        content: `In a multi-tenant SaaS, authentication (who are you?) is only half the battle. Authorization (what can you do?) is complex because permissions are scoped to specific workspaces (tenants). A user might be an 'Admin' in Workspace A but only a 'Viewer' in Workspace B.

We solve this using Role-Based Access Control (RBAC). A user's role is stored in the relationship between the User and the Tenant. We then map roles to specific permissions. In FastAPI, we can enforce these permissions elegantly using parameterized dependencies.`
      },
      {
        id: 'rbac-implementation',
        type: 'implementation',
        title: 'RBAC Dependency Injection',
        content: `We create a dependency that requires a specific permission, looks up the current tenant context (e.g., from a header or path parameter), and checks the user's role in that tenant.`,
        codeExample: {
          id: 'rbac-code',
          title: 'Permission Dependencies',
          language: 'python',
          files: {
            'app/api/deps/permissions.py': {
              language: 'python',
              code: `from fastapi import Depends, HTTPException, Header\nfrom app.api.deps import get_current_user\nfrom app.services.tenant import get_user_role\n\nclass RequirePermission:\n    def __init__(self, required_permission: str):\n        self.required_permission = required_permission\n\n    async def __call__(\n        self, \n        tenant_id: int = Header(...), \n        user = Depends(get_current_user)\n    ):\n        role = await get_user_role(user.id, tenant_id)\n        if not role:\n            raise HTTPException(status_code=403, detail="Not in workspace")\n            \n        if self.required_permission not in role.permissions:\n            raise HTTPException(status_code=403, detail="Insufficient permissions")\n            \n        return tenant_id`
            },
            'app/api/v1/endpoints/tasks.py': {
              language: 'python',
              code: `from fastapi import APIRouter, Depends\nfrom app.api.deps.permissions import RequirePermission\n\nrouter = APIRouter()\n\n@router.post("/")\nasync def create_task(\n    data: TaskCreate,\n    tenant_id: int = Depends(RequirePermission("task:create"))\n):\n    # User is guaranteed to have task:create in this tenant\n    return await task_service.create(tenant_id, data)`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'rbac-chal-1',
        title: 'Implement Role Verification',
        description: 'Write the logic that maps roles like "Admin" and "Viewer" to permissions like "task:create" and "task:read".',
        hint: 'Use a dictionary or configuration object to hold role definitions.',
        solution: 'Role definitions mapping.',
        solutionCode: {
          id: 'sol-rbac-1',
          language: 'python',
          title: 'Roles config',
          filename: 'roles.py',
          code: `ROLES = {\n    "viewer": {"task:read", "project:read"},\n    "editor": {"task:read", "task:create", "task:update", "project:read"},\n    "admin": {"task:read", "task:create", "task:update", "task:delete", "project:read", "project:create", "tenant:manage"}\n}\n\ndef has_permission(role_name: str, permission: str) -> bool:\n    return permission in ROLES.get(role_name, set())`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-rbac-1',
        question: 'How do you structure an API to handle a user belonging to multiple tenants?',
        answer: 'You typically require the client to explicitly pass the context of the tenant they are operating under, often via an `X-Tenant-ID` header or as part of the URL path (e.g., `/api/t/{tenant_id}/tasks`). The backend then verifies the user has access to that specific tenant before proceeding.',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-rbac-1',
        severity: 'warning',
        content: 'Cache RBAC permissions in Redis to avoid database lookups on every request, but ensure you invalidate the cache immediately if a users role is changed.'
      }
    ]
  },
  'core-api-implementation': {
    id: '25-05',
    slug: 'core-api-implementation',
    chapterId: 25,
    order: 5,
    title: 'Core API Implementation',
    description: 'Build robust CRUD endpoints with pagination, filtering, and OpenAPI docs.',
    duration: 90,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.postgresql, technologies.pydantic],
    prerequisites: ['25-04'],
    objectives: [
      'Implement all CRUD endpoints',
      'Add cursor-based pagination',
      'Implement filtering and sorting',
      'Write comprehensive API documentation'
    ],
    sections: [
      {
        id: 'core-concept',
        type: 'concept',
        title: 'Production CRUD Patterns',
        content: `Standard offset-based pagination (\`LIMIT\` and \`OFFSET\`) suffers from performance issues on large datasets because the database must scan and discard rows before returning the requested page. 

For a production SaaS, we implement **cursor-based pagination**. Instead of an offset, the client provides a cursor (usually an encoded timestamp or UUID of the last seen item). The database then uses a highly efficient index scan (e.g., \`WHERE id > :cursor\`). We also implement dynamic filtering using Pydantic models to validate query parameters.`
      },
      {
        id: 'core-implementation',
        type: 'implementation',
        title: 'Cursor Pagination implementation',
        content: `Cursor pagination requires ordering by a unique, sequential column. We encode the cursor so the client treats it opaquely.`,
        codeExample: {
          id: 'cursor-code',
          title: 'Cursor Pagination',
          language: 'python',
          files: {
            'app/api/pagination.py': {
              language: 'python',
              code: `import base64\nfrom typing import Generic, TypeVar, List, Optional\nfrom pydantic import BaseModel\n\nT = TypeVar("T")\n\nclass CursorPage(BaseModel, Generic[T]):\n    items: List[T]\n    next_cursor: Optional[str] = None\n\ndef encode_cursor(id: int) -> str:\n    return base64.b64encode(str(id).encode()).decode()\n\ndef decode_cursor(cursor: str) -> int:\n    return int(base64.b64decode(cursor).decode())`
            },
            'app/api/v1/endpoints/tasks.py': {
              language: 'python',
              code: `@router.get("/", response_model=CursorPage[TaskSchema])\nasync def list_tasks(\n    cursor: str = None,\n    limit: int = 50,\n    db: Session = Depends(get_db)\n):\n    query = db.query(Task).order_by(Task.id)\n    if cursor:\n        last_id = decode_cursor(cursor)\n        query = query.filter(Task.id > last_id)\n        \n    items = query.limit(limit).all()\n    next_cursor = encode_cursor(items[-1].id) if items else None\n    \n    return CursorPage(items=items, next_cursor=next_cursor)`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'core-chal-1',
        title: 'Implement dynamic filtering',
        description: 'Create a Pydantic model for query parameters to filter Tasks by status and priority.',
        hint: 'Use `Depends()` with a Pydantic model in the endpoint signature.',
        solution: 'Define model and use it.',
        solutionCode: {
          id: 'sol-core-1',
          language: 'python',
          title: 'Filter Dependencies',
          filename: 'filters.py',
          code: `from typing import Optional\nfrom pydantic import BaseModel\nfrom fastapi import Depends\n\nclass TaskFilter(BaseModel):\n    status: Optional[str] = None\n    priority: Optional[int] = None\n\n@router.get("/")\ndef get_tasks(filters: TaskFilter = Depends()):\n    # apply filters.dict(exclude_unset=True) to SQLAlchemy query\n    pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-core-1',
        question: 'What are the drawbacks of cursor-based pagination?',
        answer: 'Cursor-based pagination does not allow clients to jump to a specific page number (e.g., "Page 10"). It requires sequential navigation. It also requires the results to be sorted by a unique, sequential column, which makes complex dynamic sorting difficult.',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-core-1',
        severity: 'info',
        content: 'Use Pydantic `Field(description="...")` heavily. This automatically generates high-quality OpenAPI documentation that frontend developers and external API consumers rely on.'
      }
    ]
  },
  'caching-layer': {
    id: '25-06',
    slug: 'caching-layer',
    chapterId: 25,
    order: 6,
    title: 'Production Caching Layer',
    description: 'Implement distributed caching to optimize read-heavy API endpoints.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['25-05'],
    objectives: [
      'Add Redis caching to all read-heavy endpoints',
      'Implement stampede protection',
      'Add cache warming on deployment',
      'Monitor cache hit ratio with Prometheus'
    ],
    sections: [
      {
        id: 'cache-concept',
        type: 'concept',
        title: 'Caching Strategies & Invalidation',
        content: `As traffic scales, repeatedly querying the database for the same data (like a user's profile or workspace settings) becomes a bottleneck. We introduce Redis as an in-memory caching layer.

The hardest part of caching is invalidation. We will use a Write-Through or Cache-Aside pattern. When a resource is updated via a \`PUT\` or \`POST\` request, the service layer must immediately invalidate or update the corresponding cache key in Redis so subsequent \`GET\` requests do not serve stale data. We must also consider **Cache Stampedes**, where a hot key expires and hundreds of concurrent requests simultaneously hit the database to rebuild it.`
      },
      {
        id: 'cache-implementation',
        type: 'implementation',
        title: 'FastAPI Redis Decorator',
        content: `We can create a clean, reusable decorator to cache endpoint responses.`,
        codeExample: {
          id: 'cache-decorator',
          title: 'Cache Decorator',
          language: 'python',
          files: {
            'app/core/cache.py': {
              language: 'python',
              code: `import json\nfrom functools import wraps\nfrom fastapi import Request, Response\nfrom app.core.redis import redis_client\n\ndef cache_response(expire: int = 3600):\n    def decorator(func):\n        @wraps(func)\n        async def wrapper(*args, **kwargs):\n            request: Request = kwargs.get('request')\n            if not request:\n                return await func(*args, **kwargs)\n                \n            cache_key = f"cache:{request.url.path}:{request.url.query}"\n            cached = await redis_client.get(cache_key)\n            \n            if cached:\n                return json.loads(cached)\n                \n            response = await func(*args, **kwargs)\n            \n            # Assuming response is a Pydantic model or dict\n            await redis_client.setex(\n                cache_key, \n                expire, \n                json.dumps(response.dict())\n            )\n            return response\n        return wrapper\n    return decorator`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'cache-chal-1',
        title: 'Implement Cache Invalidation',
        description: 'Write a helper function to invalidate all cached queries related to a specific task when the task is updated.',
        hint: 'Use Redis `SCAN` or maintain a set of related keys to delete them in bulk.',
        solution: 'Use pattern matching for deletion.',
        solutionCode: {
          id: 'sol-cache-1',
          language: 'python',
          title: 'Invalidate Pattern',
          filename: 'cache.py',
          code: `async def invalidate_cache_pattern(pattern: str):\n    async for key in redis_client.scan_iter(match=pattern):\n        await redis_client.delete(key)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-cache-1',
        question: 'What is a cache stampede and how do you prevent it?',
        answer: 'A cache stampede occurs when a highly accessed cache key expires, causing all concurrent requests to miss the cache and hit the database simultaneously, potentially bringing it down. It is prevented using techniques like probabilistic early expiration (fetching a new value slightly before expiration) or distributed locking (only allowing one request to rebuild the cache while others wait).',
        difficulty: 'expert'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-cache-1',
        severity: 'critical',
        content: 'When caching responses in a multi-tenant app, you MUST include the tenant ID and user ID in the cache key. Failing to do so will result in users seeing other users data.'
      }
    ]
  },
  'background-jobs-implementation': {
    id: '25-07',
    slug: 'background-jobs-implementation',
    chapterId: 25,
    order: 7,
    title: 'Background Jobs Implementation',
    description: 'Offload heavy processing to Celery workers.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.celery, technologies.redis, technologies.fastapi],
    prerequisites: ['25-06'],
    objectives: [
      'Set up Celery with Redis broker',
      'Implement email/notification jobs',
      'Add report generation jobs',
      'Configure Flower for monitoring'
    ],
    sections: [
      {
        id: 'jobs-concept',
        type: 'concept',
        title: 'Asynchronous Task Processing',
        content: `FastAPI's built-in \`BackgroundTasks\` are great for lightweight tasks like sending a single email, but they execute in the same process as the API. If the API restarts, pending tasks are lost. 

For reliable, distributed, and heavy background processing (like generating PDF reports, processing CSV uploads, or sending bulk emails), we integrate Celery. Celery uses Redis as a message broker to queue tasks, and independent worker processes consume and execute them. This ensures API latency remains low and tasks are retried upon failure.`
      },
      {
        id: 'jobs-implementation',
        type: 'implementation',
        title: 'Celery Integration',
        content: `We define a Celery app and create tasks. In FastAPI, we simply call \`task.delay()\`.`,
        codeExample: {
          id: 'celery-code',
          title: 'Celery Tasks',
          language: 'python',
          files: {
            'app/worker.py': {
              language: 'python',
              code: `from celery import Celery\nfrom app.core.config import settings\n\ncelery_app = Celery(\n    "worker",\n    broker=settings.REDIS_URL,\n    backend=settings.REDIS_URL\n)\n\ncelery_app.conf.task_routes = {\n    "app.tasks.emails.*": "emails-queue",\n    "app.tasks.reports.*": "heavy-queue",\n}`
            },
            'app/tasks/emails.py': {
              language: 'python',
              code: `from app.worker import celery_app\nimport time\n\n@celery_app.task(bind=True, max_retries=3)\ndef send_welcome_email(self, user_id: int):\n    try:\n        # Simulate sending email\n        time.sleep(2)\n        return f"Email sent to {user_id}"\n    except Exception as exc:\n        raise self.retry(exc=exc, countdown=60)`
            },
            'app/api/v1/endpoints/users.py': {
              language: 'python',
              code: `from app.tasks.emails import send_welcome_email\n\n@router.post("/")\nasync def create_user(user: UserCreate):\n    # db logic here\n    send_welcome_email.delay(new_user.id)\n    return new_user`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'jobs-chal-1',
        title: 'Task Result Polling',
        description: 'Create an endpoint that checks the status of a Celery task using its task ID.',
        hint: 'Use AsyncResult from celery.result.',
        solution: 'Endpoint returning task status.',
        solutionCode: {
          id: 'sol-jobs-1',
          language: 'python',
          title: 'Status Endpoint',
          filename: 'endpoints.py',
          code: `from celery.result import AsyncResult\nfrom fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/status/{task_id}")\ndef get_status(task_id: str):\n    task_result = AsyncResult(task_id)\n    return {\n        "task_id": task_id,\n        "status": task_result.status,\n        "result": task_result.result if task_result.ready() else None\n    }`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-jobs-1',
        question: 'Why separate Celery queues into different types (e.g., fast, slow)?',
        answer: 'Queue separation prevents head-of-line blocking. If a user uploads a massive CSV that takes 10 minutes to process (slow queue), it shouldn\'t delay transactional emails like password resets (fast queue) that need to be delivered instantly.',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-jobs-1',
        severity: 'warning',
        content: 'Ensure all Celery tasks are idempotent. If a worker crashes mid-task, the broker might redeliver the message, causing the task to run twice. It should be safe to execute multiple times.'
      }
    ]
  },
  'realtime-features': {
    id: '25-08',
    slug: 'realtime-features',
    chapterId: 25,
    order: 8,
    title: 'Real-Time Features with WebSockets',
    description: 'Add live notifications and real-time activity feeds.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.websockets, technologies.redis],
    prerequisites: ['25-07'],
    objectives: [
      'Implement WebSocket notification system',
      'Add real-time activity feed',
      'Scale WebSockets with Redis Pub/Sub',
      'Implement presence system'
    ],
    sections: [
      {
        id: 'ws-concept',
        type: 'concept',
        title: 'Scaling WebSockets',
        content: `FastAPI makes single-server WebSockets easy, but in production, we have multiple API instances behind a load balancer. If User A connects to Instance 1, and Instance 2 needs to send them a notification, Instance 2 has no direct WebSocket connection to User A.

To solve this, we use a Backplane architecture with Redis Pub/Sub. When any API instance needs to send a notification, it publishes the message to a Redis channel. All API instances subscribe to this channel, and the instance that holds the actual WebSocket connection for the target user forwards the message.`
      },
      {
        id: 'ws-implementation',
        type: 'implementation',
        title: 'Connection Manager with Redis',
        content: `We create a ConnectionManager that handles local WebSocket connections and listens to Redis Pub/Sub.`,
        codeExample: {
          id: 'ws-manager',
          title: 'WebSocket Manager',
          language: 'python',
          files: {
            'app/websockets/manager.py': {
              language: 'python',
              code: `import json\nimport asyncio\nfrom typing import Dict\nfrom fastapi import WebSocket\nfrom app.core.redis import redis_client\n\nclass ConnectionManager:\n    def __init__(self):\n        self.active_connections: Dict[int, WebSocket] = {}\n\n    async def connect(self, websocket: WebSocket, user_id: int):\n        await websocket.accept()\n        self.active_connections[user_id] = websocket\n\n    def disconnect(self, user_id: int):\n        self.active_connections.pop(user_id, None)\n\n    async def broadcast_to_user(self, user_id: int, message: dict):\n        # 1. Publish to Redis so all instances see it\n        await redis_client.publish(\n            f"user_notify_{user_id}", \n            json.dumps(message)\n        )\n\n    async def listen_to_redis(self):\n        pubsub = redis_client.pubsub()\n        await pubsub.psubscribe("user_notify_*")\n        \n        async for message in pubsub.listen():\n            if message["type"] == "pmessage":\n                # Parse user_id from channel name\n                channel = message["channel"].decode()\n                user_id = int(channel.split("_")[-1])\n                \n                # If this instance has the connection, send it\n                if user_id in self.active_connections:\n                    ws = self.active_connections[user_id]\n                    data = message["data"].decode()\n                    await ws.send_text(data)\n\nmanager = ConnectionManager()`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'ws-chal-1',
        title: 'Implement the WebSocket Endpoint',
        description: 'Create the FastAPI WebSocket endpoint that uses the ConnectionManager.',
        hint: 'Use a dependency to authenticate the user before accepting the connection.',
        solution: 'Endpoint managing lifecycle.',
        solutionCode: {
          id: 'sol-ws-1',
          language: 'python',
          title: 'WS Endpoint',
          filename: 'endpoints.py',
          code: `from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends\n\nrouter = APIRouter()\n\n@router.websocket("/ws")\nasync def websocket_endpoint(\n    websocket: WebSocket,\n    # Pseudo-code for auth dependency:\n    # user_id: int = Depends(get_ws_user)\n):\n    user_id = 1 # mocked\n    await manager.connect(websocket, user_id)\n    try:\n        while True:\n            data = await websocket.receive_text()\n            # Handle incoming data\n    except WebSocketDisconnect:\n        manager.disconnect(user_id)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-ws-1',
        question: 'Why is Redis Pub/Sub necessary for WebSockets in a multi-node environment?',
        answer: 'WebSockets maintain stateful, long-lived TCP connections. A load balancer distributes these connections across multiple servers. If Server A needs to notify a client connected to Server B, they need a broker (Redis) to route messages between the stateless servers.',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-ws-1',
        severity: 'info',
        content: 'Ensure your load balancer (like Nginx) is configured to handle WebSocket upgrades and maintain long-lived connections without aggressively timing them out.'
      }
    ]
  },
  'rate-limiting-security': {
    id: '25-09',
    slug: 'rate-limiting-security',
    chapterId: 25,
    order: 9,
    title: 'Rate Limiting & Security Hardening',
    description: 'Protect the API from abuse and secure endpoints.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.redis, technologies.fastapi],
    prerequisites: ['25-08'],
    objectives: [
      'Implement distributed rate limiting',
      'Add all security headers',
      'Audit authentication for vulnerabilities',
      'Run security scanning in CI'
    ],
    sections: [
      {
        id: 'sec-concept',
        type: 'concept',
        title: 'Defense in Depth',
        content: `Security is not a single feature; it's layered. We start by implementing distributed rate limiting using Redis to prevent brute-force attacks and noisy neighbors from degrading service quality. 

Next, we enforce security headers (like HSTS, Content-Security-Policy, and X-Frame-Options) via middleware. Finally, we ensure our CI pipeline includes tools like Bandit for static code analysis and safety to check for known vulnerabilities in Python dependencies.`
      },
      {
        id: 'sec-implementation',
        type: 'implementation',
        title: 'Redis Rate Limiter',
        content: `Using the Token Bucket or Fixed Window algorithm via Redis to limit requests per IP or User.`,
        codeExample: {
          id: 'rate-limit-code',
          title: 'FastAPI Rate Limiting',
          language: 'python',
          files: {
            'app/api/deps/ratelimit.py': {
              language: 'python',
              code: `from fastapi import HTTPException, Request\nfrom app.core.redis import redis_client\n\nclass RateLimiter:\n    def __init__(self, times: int, seconds: int):\n        self.times = times\n        self.seconds = seconds\n\n    async def __call__(self, request: Request):\n        # Fallback to IP if user not authenticated\n        client_id = request.client.host\n        if hasattr(request.state, "user"):\n            client_id = str(request.state.user.id)\n            \n        key = f"rate_limit:{request.url.path}:{client_id}"\n        \n        # Redis pipeline for atomic increment and expire\n        async with redis_client.pipeline(transaction=True) as pipe:\n            pipe.incr(key)\n            pipe.expire(key, self.seconds, nx=True)\n            results = await pipe.execute()\n            \n        requests = results[0]\n        if requests > self.times:\n            raise HTTPException(\n                status_code=429, \n                detail="Too Many Requests"\n            )`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'sec-chal-1',
        title: 'Apply rate limits',
        description: 'Apply a rate limit of 5 requests per minute to the login endpoint.',
        hint: 'Use the `dependencies` parameter in the route decorator.',
        solution: 'Inject the RateLimiter.',
        solutionCode: {
          id: 'sol-sec-1',
          language: 'python',
          title: 'Endpoint Rate Limit',
          filename: 'auth.py',
          code: `from app.api.deps.ratelimit import RateLimiter\n\n@router.post("/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])\nasync def login():\n    pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-sec-1',
        question: 'What is the difference between Token Bucket and Fixed Window rate limiting algorithms?',
        answer: 'Fixed window counts requests in discrete time intervals (e.g., 00:00 to 00:01). It can suffer from spikes at the boundaries. Token bucket adds tokens at a steady rate; requests consume tokens. It smooths out traffic and handles bursts better.',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-sec-1',
        severity: 'critical',
        content: 'Never rely solely on IP addresses for rate limiting in production, as many users might share an IP behind a corporate NAT. Limit by User ID where possible.'
      }
    ]
  },
  'observability-implementation': {
    id: '25-10',
    slug: 'observability-implementation',
    chapterId: 25,
    order: 10,
    title: 'Full Observability Implementation',
    description: 'Instrument the application with metrics, logs, and distributed traces.',
    duration: 90,
    difficulty: 'production',
    technologies: [technologies.prometheus, technologies.grafana, technologies.opentelemetry, technologies.fastapi],
    prerequisites: ['25-09'],
    objectives: [
      'Add Prometheus metrics for all endpoints',
      'Implement OpenTelemetry distributed tracing',
      'Configure structured JSON logging',
      'Build comprehensive Grafana dashboard'
    ],
    sections: [
      {
        id: 'obs-concept',
        type: 'concept',
        title: 'The Three Pillars of Observability',
        content: `When a production issue occurs, you need to know *that* it's broken (Metrics), *where* it's broken (Traces), and *why* it's broken (Logs). 

We will use Prometheus middleware to automatically track request rates, error rates, and latencies (the RED metrics). OpenTelemetry will inject context IDs into requests, allowing us to trace a single request as it hits the FastAPI server, queries PostgreSQL, and triggers a Celery task. Finally, we implement structured JSON logging to make logs easily searchable in tools like ELK or Datadog.`
      },
      {
        id: 'obs-implementation',
        type: 'implementation',
        title: 'OpenTelemetry Setup',
        content: `Instrumenting FastAPI and SQLAlchemy with OpenTelemetry automatically generates spans for API requests and database queries.`,
        codeExample: {
          id: 'otel-code',
          title: 'Instrumentation',
          language: 'python',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI\nfrom opentelemetry.instrumentation.fastapi import FastAPIInstrumentor\nfrom opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor\nfrom prometheus_fastapi_instrumentator import Instrumentator\n\napp = FastAPI()\n\n# Add Prometheus metrics\nInstrumentator().instrument(app).expose(app)\n\n# Add OpenTelemetry\nFastAPIInstrumentor.instrument_app(app)\n\n# In your db.py\n# engine = create_engine(...)\n# SQLAlchemyInstrumentor().instrument(engine=engine)`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'obs-chal-1',
        title: 'Structured Logging Middleware',
        description: 'Create a middleware that logs every request method, path, and duration as a JSON object.',
        hint: 'Use `time.time()` before and after the `call_next(request)` execution.',
        solution: 'Middleware logging JSON.',
        solutionCode: {
          id: 'sol-obs-1',
          language: 'python',
          title: 'Logging Middleware',
          filename: 'middleware.py',
          code: `import time\nimport logging\nimport json\nfrom fastapi import Request\n\nlogger = logging.getLogger(__name__)\n\nasync def log_requests(request: Request, call_next):\n    start_time = time.time()\n    response = await call_next(request)\n    process_time = time.time() - start_time\n    \n    log_dict = {\n        "method": request.method,\n        "path": request.url.path,\n        "status": response.status_code,\n        "duration_ms": round(process_time * 1000, 2)\n    }\n    logger.info(json.dumps(log_dict))\n    \n    return response`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-obs-1',
        question: 'What is the purpose of a Trace ID versus a Span ID in distributed tracing?',
        answer: 'A Trace ID represents the entire journey of a single request across multiple microservices. A Span ID represents a specific operation or segment within that journey (e.g., an HTTP request or a database query).',
        difficulty: 'advanced'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-obs-1',
        severity: 'warning',
        content: 'High-cardinality data in Prometheus labels (like user IDs or raw URLs) will cause memory issues and crash the Prometheus server. Only use bounded labels like route templates (e.g., /users/{id}).'
      }
    ]
  },
  'docker-production': {
    id: '25-11',
    slug: 'docker-production',
    chapterId: 25,
    order: 11,
    title: 'Docker Production Build',
    description: 'Optimize Dockerfiles for security, size, and speed.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.docker, technologies.fastapi],
    prerequisites: ['25-10'],
    objectives: [
      'Build minimal multi-stage production images',
      'Optimize image layers for fast CI builds',
      'Run security scan on all images'
    ],
    sections: [
      {
        id: 'docker-concept',
        type: 'concept',
        title: 'Multi-Stage Production Builds',
        content: `A local development Dockerfile often installs compilers, testing tools, and mounts volumes. A production image must be entirely self-contained, minimal in size, and run as a non-root user for security.

We achieve this using multi-stage builds. Stage one acts as a "builder", compiling Python wheels and installing dependencies. Stage two is the "runner", which simply copies the compiled artifacts from the builder onto a slim base image, resulting in a significantly smaller attack surface and faster deployment times.`
      },
      {
        id: 'docker-implementation',
        type: 'implementation',
        title: 'The Production Dockerfile',
        content: `This Dockerfile optimizes layer caching and runs Uvicorn securely.`,
        codeExample: {
          id: 'prod-dockerfile',
          title: 'Multi-Stage Dockerfile',
          language: 'dockerfile',
          filename: 'Dockerfile',
          code: `# Stage 1: Builder\nFROM python:3.11-slim as builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt\n\n# Stage 2: Runner\nFROM python:3.11-slim\nWORKDIR /app\n\n# Create non-root user\nRUN addgroup --system appgroup && adduser --system --group appuser\n\n# Install dependencies from wheels\nCOPY --from=builder /app/wheels /wheels\nRUN pip install --no-cache /wheels/*\n\nCOPY . .\nRUN chown -R appuser:appgroup /app\nUSER appuser\n\nEXPOSE 8000\nCMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'dock-chal-1',
        title: 'Identify Layer Inefficiencies',
        description: 'Explain why `COPY . .` should be placed after `pip install` in a Dockerfile.',
        hint: 'Think about how Docker caches layers and what triggers a cache bust.',
        solution: 'If COPY . . is first, any code change breaks the cache for pip install, making builds very slow.',
        solutionCode: {
          id: 'sol-dock-1',
          language: 'text',
          title: 'Explanation',
          filename: 'explanation.txt',
          code: `Docker layers are cached. If a layer changes, all subsequent layers are rebuilt. Code changes frequently, but dependencies change rarely. By copying requirements and running pip install first, those layers stay cached during normal code development.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-dock-1',
        question: 'Why should you run containers as a non-root user?',
        answer: 'If a vulnerability is exploited in your application, the attacker gains the privileges of the user running the process. If running as root, the attacker has root access inside the container, making container escapes and host system compromises much easier.',
        difficulty: 'intermediate'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-dock-1',
        severity: 'critical',
        content: 'Use an explicit tag for base images (e.g., python:3.11.4-slim) rather than the "latest" tag to ensure reproducible builds.'
      }
    ]
  },
  'kubernetes-deployment': {
    id: '25-12',
    slug: 'kubernetes-deployment',
    chapterId: 25,
    order: 12,
    title: 'Kubernetes Production Deployment',
    description: 'Deploy the application stack to a Kubernetes cluster.',
    duration: 90,
    difficulty: 'production',
    technologies: [technologies.kubernetes, technologies.nginx],
    prerequisites: ['25-11'],
    objectives: [
      'Write all Kubernetes manifests',
      'Configure HPA for API and workers',
      'Set up Nginx Ingress with TLS'
    ],
    sections: [
      {
        id: 'k8s-concept',
        type: 'concept',
        title: 'Orchestrating SaaS at Scale',
        content: `Kubernetes (K8s) manages containerized applications across a cluster of machines, handling load balancing, auto-scaling, and self-healing. 

We will deploy our FastAPI application as a \`Deployment\` with multiple replicas. We define \`Services\` to allow internal communication (e.g., API communicating with Redis), and an \`Ingress\` resource to route external traffic to the API, terminating TLS (HTTPS) via Let's Encrypt. Finally, we configure a Horizontal Pod Autoscaler (HPA) to automatically add more FastAPI pods when CPU utilization spikes.`
      },
      {
        id: 'k8s-implementation',
        type: 'implementation',
        title: 'FastAPI Deployment Manifest',
        content: `Notice the inclusion of resource limits, readiness probes, and liveness probes.`,
        codeExample: {
          id: 'k8s-deploy',
          title: 'Deployment & Service',
          language: 'yaml',
          filename: 'api-deployment.yaml',
          code: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: fastapi-app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: fastapi-app\n  template:\n    metadata:\n      labels:\n        app: fastapi-app\n    spec:\n      containers:\n      - name: fastapi\n        image: myregistry/taskflow-api:v1.0.0\n        ports:\n        - containerPort: 8000\n        envFrom:\n        - secretRef:\n            name: api-secrets\n        resources:\n          requests:\n            cpu: 100m\n            memory: 256Mi\n          limits:\n            cpu: 500m\n            memory: 512Mi\n        livenessProbe:\n          httpGet:\n            path: /health\n            port: 8000\n          initialDelaySeconds: 10\n        readinessProbe:\n          httpGet:\n            path: /health\n            port: 8000\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: fastapi-service\nspec:\n  selector:\n    app: fastapi-app\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: 8000`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'k8s-chal-1',
        title: 'Configure Autoscaling',
        description: 'Write a HorizontalPodAutoscaler (HPA) manifest targeting the deployment.',
        hint: 'Use apiVersion: autoscaling/v2.',
        solution: 'HPA manifest.',
        solutionCode: {
          id: 'sol-k8s-1',
          language: 'yaml',
          title: 'HPA configuration',
          filename: 'hpa.yaml',
          code: `apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: fastapi-hpa\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: fastapi-app\n  minReplicas: 3\n  maxReplicas: 10\n  metrics:\n  - type: Resource\n    resource:\n      name: cpu\n      target:\n        type: Utilization\n        averageUtilization: 70`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-k8s-1',
        question: 'What is the difference between a Liveness probe and a Readiness probe?',
        answer: 'A Readiness probe checks if a pod is ready to accept traffic; if it fails, the pod is removed from the load balancer. A Liveness probe checks if the application is healthy and running; if it fails, Kubernetes will automatically kill and restart the pod.',
        difficulty: 'intermediate'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-k8s-1',
        severity: 'critical',
        content: 'Always define resource limits. If a pod has a memory leak and no limit, it will consume node resources until it starves other critical system components, crashing the entire node.'
      }
    ]
  },
  'load-testing': {
    id: '25-13',
    slug: 'load-testing',
    chapterId: 25,
    order: 13,
    title: 'Load Testing & Performance Validation',
    description: 'Simulate high traffic to ensure the system meets performance SLAs.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.prometheus],
    prerequisites: ['25-12'],
    objectives: [
      'Write realistic Locust scenarios',
      'Run load tests against staging',
      'Identify and fix performance bottlenecks'
    ],
    sections: [
      {
        id: 'load-concept',
        type: 'concept',
        title: 'Proving Scalability',
        content: `Before launch, you must prove the system can handle expected traffic. We use Locust, a Python-based load testing tool, to simulate thousands of concurrent users executing realistic workflows (logging in, creating tasks, fetching lists).

We run these tests against a Staging environment that mirrors Production infrastructure. During the test, we monitor Grafana dashboards to identify bottlenecks. Is the CPU maxing out? Are database connections exhausted? Is Redis memory full? This guides performance tuning.`
      },
      {
        id: 'load-implementation',
        type: 'implementation',
        title: 'Locust User Behavior',
        content: `We define user behavior in code, simulating API calls.`,
        codeExample: {
          id: 'locust-code',
          title: 'Load Test Script',
          language: 'python',
          filename: 'locustfile.py',
          code: `from locust import HttpUser, task, between\nimport random\n\nclass APIUser(HttpUser):\n    wait_time = between(1, 3)\n    token = None\n\n    def on_start(self):\n        # Setup: Login and get token\n        response = self.client.post("/api/v1/auth/login", data={\n            "username": "testuser@example.com",\n            "password": "password"\n        })\n        self.token = response.json()["access_token"]\n        self.client.headers.update({"Authorization": f"Bearer {self.token}"})\n\n    @task(3)\n    def view_tasks(self):\n        self.client.get("/api/v1/tasks/")\n\n    @task(1)\n    def create_task(self):\n        self.client.post("/api/v1/tasks/", json={\n            "title": f"Load Test Task {random.randint(1,1000)}",\n            "status": "pending"\n        })`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'load-chal-1',
        title: 'Interpret Results',
        description: 'During a load test, the P95 latency is 1.5 seconds, but CPU is at 20%. Where is the bottleneck likely located?',
        hint: 'If CPU is low, the application is likely waiting for I/O.',
        solution: 'I/O bottleneck analysis.',
        solutionCode: {
          id: 'sol-load-1',
          language: 'text',
          title: 'Analysis',
          filename: 'analysis.txt',
          code: `The application is likely blocked by slow database queries, lack of database connections (connection pool exhaustion), or a slow external API call. Check database query performance and connection pool metrics.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-load-1',
        question: 'Why do we look at P95 or P99 latency instead of average latency?',
        answer: 'Average latency hides outliers. If 90% of requests take 10ms, but 10% take 2 seconds, the average might be acceptable, but 10% of users are having a terrible experience. P95 (the 95th percentile) guarantees that 95% of requests completed faster than that number, giving a much truer picture of user experience.',
        difficulty: 'intermediate'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-load-1',
        severity: 'warning',
        content: 'Ensure your load balancer limits, application connection pools, and database `max_connections` are tuned in sync. If one defaults to a low number, it becomes an artificial bottleneck.'
      }
    ]
  },
  'slo-definition-monitoring': {
    id: '25-14',
    slug: 'slo-definition-monitoring',
    chapterId: 25,
    order: 14,
    title: 'SLO Definition & Monitoring',
    description: 'Define reliability targets and configure alerting.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.prometheus, technologies.grafana],
    prerequisites: ['25-13'],
    objectives: [
      'Define availability and latency SLOs',
      'Implement SLI measurements',
      'Configure error budget alerts'
    ],
    sections: [
      {
        id: 'slo-concept',
        type: 'concept',
        title: 'SRE Fundamentals',
        content: `Site Reliability Engineering (SRE) relies on SLOs (Service Level Objectives) to measure success. An SLO is a target value for a service level, measured by an SLI (Service Level Indicator).

For example, an Availability SLO might be: "99.9% of all API requests return a non-5xx status code in a rolling 30-day window." A Latency SLO might be: "95% of all /api/v1/tasks requests complete in under 200ms." We configure Prometheus Alertmanager to notify the on-call engineer when we burn through our error budget too quickly.`
      },
      {
        id: 'slo-implementation',
        type: 'implementation',
        title: 'Prometheus Alerting Rules',
        content: `We define rules in Prometheus that trigger when SLIs violate SLOs.`,
        codeExample: {
          id: 'prom-rules',
          title: 'Alert Rules',
          language: 'yaml',
          filename: 'alerts.yaml',
          code: `groups:\n- name: FastAPI_SLOs\n  rules:\n  - alert: HighErrorRate\n    expr: |\n      sum(rate(fastapi_requests_total{status=~"5.."}[5m])) \n      / \n      sum(rate(fastapi_requests_total[5m])) > 0.01\n    for: 5m\n    labels:\n      severity: critical\n    annotations:\n      summary: High HTTP 5xx error rate detected.\n      \n  - alert: HighLatency\n    expr: |\n      histogram_quantile(0.95, sum(rate(fastapi_request_duration_seconds_bucket[5m])) by (le)) > 0.2\n    for: 10m\n    labels:\n      severity: warning\n    annotations:\n      summary: P95 latency is exceeding 200ms.`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'slo-chal-1',
        title: 'Calculate Error Budget',
        description: 'If you have a 99.9% availability SLO and receive 10,000,000 requests a month, how many requests are allowed to fail?',
        hint: 'Calculate 0.1% of the total requests.',
        solution: 'Math calculation.',
        solutionCode: {
          id: 'sol-slo-1',
          language: 'text',
          title: 'Calculation',
          filename: 'calc.txt',
          code: `0.1% (or 0.001) allowed failure rate. \n0.001 * 10,000,000 = 10,000 allowed failed requests per month (the error budget).`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-slo-1',
        question: 'What is an Error Budget and how does it influence engineering decisions?',
        answer: 'An error budget is the allowed threshold for failure (e.g., if SLO is 99.9%, the budget is 0.1%). If a team depletes its error budget, product feature development is usually frozen, and engineering focuses solely on reliability until the budget recovers.',
        difficulty: 'expert'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-slo-1',
        severity: 'info',
        content: 'Do not alert on every single error. Alert on the burn rate (how fast the error budget is being consumed). This prevents alert fatigue.'
      }
    ]
  },
  'production-launch': {
    id: '25-15',
    slug: 'production-launch',
    chapterId: 25,
    order: 15,
    title: 'Production Launch Checklist & Operations',
    description: 'Finalize launch tasks and establish operational runbooks.',
    duration: 60,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.kubernetes, technologies.prometheus],
    prerequisites: ['25-14'],
    objectives: [
      'Complete production readiness checklist',
      'Configure on-call rotation and alerting',
      'Write operational runbooks',
      'Perform final security audit'
    ],
    sections: [
      {
        id: 'launch-concept',
        type: 'concept',
        title: 'Day 2 Operations',
        content: `Launching the software is only the beginning. "Day 2 Operations" involves maintaining, troubleshooting, and scaling the system. 

Before flipping the switch, a Production Readiness Review (PRR) ensures all boxes are checked: automated backups verified, CI/CD secured, secrets managed via HashiCorp Vault or AWS Secrets Manager, alerting routed to PagerDuty, and runbooks written. Runbooks are step-by-step guides for engineers to resolve common alerts (e.g., "What to do when Redis memory hits 90%").`
      },
      {
        id: 'launch-implementation',
        type: 'implementation',
        title: 'Sample Runbook Entry',
        content: `A good runbook is concise, actionable, and contains commands.`,
        codeExample: {
          id: 'runbook-code',
          title: 'Database CPU Runbook',
          language: 'markdown',
          filename: 'runbooks/high_db_cpu.md',
          code: `# Alert: High Database CPU\n**Severity**: Critical\n\n## Context\nThe primary PostgreSQL instance is experiencing CPU utilization > 90% for over 10 minutes.\n\n## Troubleshooting Steps\n1. Connect to the database and identify long-running queries:\n   \`\`\`sql\n   SELECT pid, now() - pg_stat_activity.query_start AS duration, query\n   FROM pg_stat_activity\n   WHERE state = 'active'\n   ORDER BY duration DESC;\n   \`\`\`\n2. Check if a specific API endpoint is being spammed (View Grafana API Dashboard).\n3. If a single bad query is locking resources, kill it:\n   \`\`\`sql\n   SELECT pg_terminate_backend(<pid>);\n   \`\`\`\n4. If it's organic traffic spike, scale up the database instance via Terraform.`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: 'launch-chal-1',
        title: 'Create a PRR Checklist',
        description: 'List 5 critical items that must be verified before going to production.',
        hint: 'Think about data loss, security, and observability.',
        solution: 'Checklist details.',
        solutionCode: {
          id: 'sol-launch-1',
          language: 'markdown',
          title: 'PRR List',
          filename: 'prr.md',
          code: `1. Database automated backups are enabled and restore process is tested.\n2. No secrets/passwords are hardcoded in the codebase.\n3. TLS/SSL is enforced for all external traffic.\n4. Alerts are configured and route to the correct on-call system.\n5. All endpoints are protected by rate limiting and authentication.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-launch-1',
        question: 'What is a post-mortem, and why is it blameless?',
        answer: 'A post-mortem is a document written after an outage detailing what happened, why it happened, and how to prevent it. It must be blameless (focusing on system failures rather than human error) so engineers feel safe being honest, which is necessary to uncover the true root causes and improve the system.',
        difficulty: 'advanced'
      }
    ],
    commonMistakes: [],
    productionNotes: [
      {
        id: 'pn-launch-1',
        severity: 'critical',
        content: 'Never launch on a Friday. If something breaks, you will be debugging it over the weekend with limited staff.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-launch-1',
        scenario: 'The Silent Outage',
        problem: 'The background Celery workers silently crashed. No alerts fired because API metrics (HTTP 200s) looked fine, but emails stopped sending for 12 hours.',
        solution: 'Added specific Prometheus metrics for Celery queue depth and worker health, and created alerts triggering when queue length exceeds a threshold.'
      }
    ]
  }
};
