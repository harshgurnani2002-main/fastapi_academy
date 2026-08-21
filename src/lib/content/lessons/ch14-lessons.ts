import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch14Lessons: Record<string, Lesson> = {
  'rest-design-principles': {
    id: '14-01',
    slug: 'rest-design-principles',
    chapterId: 14,
    order: 1,
    title: 'REST Design Principles',
    description: 'Apply REST constraints correctly in FastAPI.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Apply REST constraints correctly',
      'Design resource URIs',
      'Use HTTP methods semantically',
      'Understand statelessness in REST'
    ],
    sections: [
      {
        id: '14-01-concept',
        type: 'concept',
        title: 'REST API Concepts',
        content: `REST (Representational State Transfer) is an architectural style rather than a strict protocol. It relies on standard HTTP methods, statelessness, and resource representations.
        
In FastAPI, we use routes to define our REST endpoints. A common mistake is treating endpoints as RPC (Remote Procedure Call) commands instead of resources. For example, instead of \`/get_users\` or \`/create_user\`, we use the \`/users\` resource with \`GET\` and \`POST\` methods.

Statelessness is a critical constraint. Each request must contain all the information necessary for the server to understand and fulfill it. The server should not rely on any stored session context on the backend to process the request.`,
      },
      {
        id: '14-01-implementation',
        type: 'implementation',
        title: 'Basic REST Routes in FastAPI',
        content: `FastAPI makes it easy to map HTTP methods to resource URIs. Notice how we use nouns for resources (users, orders) and HTTP verbs to define actions on them.`,
        codeExample: {
          id: '14-01-code',
          language: 'python',
          title: 'RESTful Routing in FastAPI',
          filename: 'main.py',
          code: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI()

class User(BaseModel):
    id: int
    name: str

users_db = []

@app.get("/users", response_model=List[User])
def get_users():
    return users_db

@app.post("/users", response_model=User, status_code=201)
def create_user(user: User):
    users_db.append(user)
    return user

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    for u in users_db:
        if u.id == user_id:
            return u
    raise HTTPException(status_code=404, detail="User not found")
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-01-challenge',
        title: 'Design a REST API',
        description: 'Create RESTful routes for a Task resource.',
        hint: 'Use GET, POST, PUT, DELETE for CRUD.',
        solution: 'Define endpoints using standard HTTP methods and resource paths.',
        solutionCode: {
          id: '14-01-sol',
          language: 'python',
          title: 'Task REST API',
          filename: 'tasks.py',
          code: `from fastapi import FastAPI\napp = FastAPI()\n@app.get("/tasks")\ndef list_tasks(): pass\n@app.post("/tasks")\ndef create_task(): pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '14-01-q1',
        question: 'What is HATEOAS and do we typically implement it in modern REST APIs?',
        answer: 'HATEOAS (Hypermedia As The Engine Of Application State) means the server includes hypermedia links in responses to help clients discover actions dynamically. While it is the highest level of REST maturity (Richardson Maturity Model Level 3), most modern REST APIs do not fully implement it due to complexity and client-side coupling, typically stopping at Level 2 (HTTP verbs and URI resources).',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '14-01-pn',
        severity: 'info',
        content: 'Stick to plural nouns for resources (e.g., /users, not /user) for consistency.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'resource-modeling': {
    id: '14-02',
    slug: 'resource-modeling',
    chapterId: 14,
    order: 2,
    title: 'Resource Modeling',
    description: 'Model APIs with complex resource relationships.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.pydantic],
    prerequisites: [],
    objectives: [
      'Identify resources from domain entities',
      'Design resource relationship endpoints',
      'Choose flat vs nested URL structures',
      'Name resources consistently with conventions'
    ],
    sections: [
      {
        id: '14-02-concept',
        type: 'concept',
        title: 'Modeling Relationships',
        content: `Resource modeling requires mapping your domain entities to RESTful endpoints. When resources have relationships, you face a choice between nested URLs and flat structures.
        
For a 1:N relationship like Authors to Books, a nested URL like \`/authors/\${id}/books\` makes sense if books cannot exist independently of an author. However, if books are first-class resources, a flat structure like \`/books?author_id=\${id}\` is often better for flexibility. Deep nesting (\`/authors/\${id}/books/\${book_id}/reviews/\${review_id}\`) should be avoided.`,
      },
      {
        id: '14-02-implementation',
        type: 'implementation',
        title: 'Implementing Resource Models',
        content: `Here is how to structure routers to handle resource relationships gracefully.`,
        codeExample: {
          id: '14-02-code',
          title: 'Resource Modeling',
          files: {
            'app/routers/authors.py': {
              language: 'python',
              code: `from fastapi import APIRouter
router = APIRouter(prefix="/authors", tags=["authors"])

@router.get("/{author_id}/books")
async def get_author_books(author_id: int):
    return [{"id": 1, "title": "Book 1", "author_id": author_id}]
`
            },
            'app/routers/books.py': {
              language: 'python',
              code: `from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/books", tags=["books"])

@router.get("/")
async def list_books(author_id: Optional[int] = Query(None)):
    if author_id:
        return [{"id": 1, "title": f"Book by {author_id}"}]
    return [{"id": 1, "title": "Book 1"}, {"id": 2, "title": "Book 2"}]
`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-02-challenge',
        title: 'Nested vs Flat',
        description: 'Design endpoints for a blog with posts and comments.',
        hint: 'Comments belong to posts, but maybe they can be listed globally.',
        solution: 'Use /posts/{id}/comments for post-specific, /comments for global.',
        solutionCode: {
          id: '14-02-sol',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `# Both approaches combined`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '14-02-pn',
        severity: 'warning',
        content: 'Limit URL nesting to a maximum of 2 levels (e.g. /resource/{id}/subresource). Any deeper makes the API hard to use and brittle.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'http-method-semantics': {
    id: '14-03',
    slug: 'http-method-semantics',
    chapterId: 14,
    order: 3,
    title: 'HTTP Method Semantics & Idempotency',
    description: 'Master HTTP methods, idempotency, and status codes.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Use POST for creation, PUT for replacement',
      'Use PATCH for partial updates (JSON Merge Patch)',
      'Ensure DELETE and PUT are idempotent',
      'Return appropriate status codes per method'
    ],
    sections: [
      {
        id: '14-03-concept',
        type: 'concept',
        title: 'Idempotency and Methods',
        content: `Idempotency means that making the same request multiple times has the same effect on the server state as making it once. GET, PUT, and DELETE must be idempotent. POST is not.
        
A common point of confusion is PUT vs PATCH. PUT replaces the entire resource. If a field is omitted in a PUT request, it should be set to null or its default value. PATCH, however, only updates the provided fields. Designing PATCH in strictly-typed languages requires careful use of \`exclude_unset=True\` in Pydantic.`,
      },
      {
        id: '14-03-implementation',
        type: 'implementation',
        title: 'Implementing PATCH with Pydantic',
        content: `FastAPI and Pydantic make PATCH updates robust by allowing optional fields and checking what was actually sent.`,
        codeExample: {
          id: '14-03-code',
          language: 'python',
          title: 'PUT vs PATCH',
          filename: 'main.py',
          code: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None

items_db = {1: Item(name="Pen", description="Blue ink", price=1.5)}

@app.patch("/items/{item_id}", response_model=Item)
def patch_item(item_id: int, update_data: ItemUpdate):
    if item_id not in items_db:
        raise HTTPException(status_code=404)
        
    stored_item = items_db[item_id]
    
    # exclude_unset=True ensures we only update fields the client explicitly sent
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Merge the updates
    updated_item_data = stored_item.model_dump()
    updated_item_data.update(update_dict)
    
    # Save back
    updated_item = Item(**updated_item_data)
    items_db[item_id] = updated_item
    
    return updated_item
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-03-challenge',
        title: 'Implement PUT vs PATCH',
        description: 'Differentiate between replacing a resource and patching it.',
        hint: 'PUT replaces all fields. PATCH uses exclude_unset.',
        solution: 'Use dump(exclude_unset=True) for PATCH.',
        solutionCode: {
          id: '14-03-sol',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `# Solution code here`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'pagination-strategies': {
    id: '14-04',
    slug: 'pagination-strategies',
    chapterId: 14,
    order: 4,
    title: 'Pagination Strategies',
    description: 'Implement efficient offset and cursor pagination.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: [],
    objectives: [
      'Implement offset, cursor, and keyset pagination',
      'Return pagination metadata in responses',
      'Handle page size limits',
      'Build stable pagination over changing datasets'
    ],
    sections: [
      {
        id: '14-04-concept',
        type: 'concept',
        title: 'Offset vs Cursor Pagination',
        content: `Offset pagination (\`LIMIT 10 OFFSET 20\`) is easy to implement but suffers from two major flaws: performance degradation on high offsets (the database still has to scan and skip the offset rows) and data drift (if items are inserted/deleted while the user paginates, they might miss items or see duplicates).
        
Cursor (or Keyset) pagination solves both issues. By passing a reference to the last seen item (e.g., \`?after=12345\`), the database can jump directly using an index (\`WHERE id > 12345 LIMIT 10\`). It is highly performant and stable under dataset changes, though harder to implement for complex sorting.`,
      },
      {
        id: '14-04-implementation',
        type: 'implementation',
        title: 'Cursor Pagination in FastAPI & SQLAlchemy',
        content: `Here is a production-grade cursor pagination implementation.`,
        codeExample: {
          id: '14-04-code',
          language: 'python',
          title: 'Cursor Pagination',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Query, Depends
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

# Pseudo SQLAlchemy setup
from app.database import get_db
from app.models import User

app = FastAPI()

class PaginatedResponse(BaseModel):
    data: List[dict]
    next_cursor: Optional[int]

@app.get("/users", response_model=PaginatedResponse)
def get_users_cursor(
    limit: int = Query(10, ge=1, le=100),
    cursor: Optional[int] = Query(None, description="ID of the last item seen"),
    db: Session = Depends(get_db)
):
    query = select(User).order_by(User.id)
    
    if cursor:
        query = query.where(User.id > cursor)
        
    # Fetch limit + 1 to know if there is a next page
    query = query.limit(limit + 1)
    
    results = db.execute(query).scalars().all()
    
    has_next = len(results) > limit
    items = results[:limit]
    
    next_cursor = items[-1].id if has_next else None
    
    return {
        "data": [{"id": u.id, "name": u.name} for u in items],
        "next_cursor": next_cursor
    }
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-04-challenge',
        title: 'Offset Pagination limits',
        description: 'Implement safety limits for offset pagination.',
        hint: 'Use max constraints on limit and offset parameters.',
        solution: 'Use Query(le=100) for limit.',
        solutionCode: {
          id: '14-04-sol',
          language: 'python',
          title: 'Solution',
          filename: 'sol.py',
          code: `limit: int = Query(10, le=100)`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '14-04-pn',
        severity: 'critical',
        content: 'Never expose unbounded queries. Every list endpoint must have a default and maximum limit to prevent clients from requesting massive payloads that cause OOM (Out of Memory) crashes.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'filtering-sorting': {
    id: '14-05',
    slug: 'filtering-sorting',
    chapterId: 14,
    order: 5,
    title: 'Filtering, Sorting & Searching',
    description: 'Design robust filtering and sorting APIs.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: [],
    objectives: [
      'Design filter query parameter schema',
      'Implement SQL filtering safely (no injection)',
      'Allow multiple sort fields with direction',
      'Implement full-text search API'
    ],
    sections: [
      {
        id: '14-05-concept',
        type: 'concept',
        title: 'Query Parameters for Filtering',
        content: `Standardizing filtering and sorting parameters provides a predictable experience for API consumers. A common pattern is using bracket notation or explicit operators like \`?price_gt=100&sort=-created_at,name\`.
        
FastAPI depends heavily on Pydantic models. You can create dependency classes to parse complex filter strings into structured filters that SQLAlchemy can use securely, mitigating any injection risks.`,
      },
      {
        id: '14-05-implementation',
        type: 'implementation',
        title: 'Dynamic Sorting and Filtering',
        content: `We can build a reusable dependency to parse sort fields like \`-created_at\` (descending) or \`name\` (ascending).`,
        codeExample: {
          id: '14-05-code',
          language: 'python',
          title: 'Sort Dependency',
          filename: 'dependencies.py',
          code: `from fastapi import Query, Depends
from typing import List, Tuple

def parse_sort(sort: str = Query(None, description="Comma-separated fields. Prefix with '-' for desc.")) -> List[Tuple[str, bool]]:
    if not sort:
        return []
    
    sort_fields = []
    for field in sort.split(","):
        field = field.strip()
        if not field: continue
        
        is_desc = field.startswith("-")
        clean_field = field[1:] if is_desc else field
        sort_fields.append((clean_field, is_desc))
        
    return sort_fields

# Usage in a router:
# @app.get("/items")
# def get_items(sort: List[Tuple[str, bool]] = Depends(parse_sort)):
#     return sort
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-05-challenge',
        title: 'Implement Sorting',
        description: 'Use the parsed sort fields in SQLAlchemy.',
        hint: 'Use getattr(Model, field).desc()',
        solution: 'Apply the sorts dynamically.',
        solutionCode: {
          id: '14-05-sol',
          language: 'python',
          title: 'Solution',
          filename: 'sol.py',
          code: `# dynamic sqlalchemy order_by`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'error-response-design': {
    id: '14-06',
    slug: 'error-response-design',
    chapterId: 14,
    order: 6,
    title: 'Error Response Design',
    description: 'Standardize API errors using machine-readable formats.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.pydantic],
    prerequisites: [],
    objectives: [
      'Design error response schema with code, message, details',
      'Return machine-readable error codes',
      'Include field-level validation errors',
      'Document all error codes in OpenAPI'
    ],
    sections: [
      {
        id: '14-06-concept',
        type: 'concept',
        title: 'Standardizing Errors (RFC 7807)',
        content: `Returning inconsistent errors is a major pain point for API consumers. While FastAPI defaults to returning \`{"detail": "..."}\`, a production API should standardize errors using a structured schema, ideally inspired by RFC 7807 (Problem Details for HTTP APIs).
        
A structured error must have at minimum: a machine-readable \`code\` (like \`USER_NOT_FOUND\`), a human-readable \`message\`, and an optional \`details\` object for things like validation failures. HTTP status codes alone are not enough, as a 400 Bad Request could mean fifty different things.`,
      },
      {
        id: '14-06-implementation',
        type: 'implementation',
        title: 'Custom Exception Handlers',
        content: `You can override FastAPI's default exception handlers to enforce a standard error structure across the entire application.`,
        codeExample: {
          id: '14-06-code',
          language: 'python',
          title: 'Custom Error Handling',
          filename: 'errors.py',
          code: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

app = FastAPI()

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: dict | list | None = None

class APIException(Exception):
    def __init__(self, status_code: int, code: str, message: str, details=None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            code=exc.code,
            message=exc.message,
            details=exc.details
        ).model_dump()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            code="VALIDATION_ERROR",
            message="The request payload was invalid.",
            details=exc.errors()
        ).model_dump()
    )

@app.get("/users/{user_id}")
def get_user(user_id: int):
    raise APIException(
        status_code=404,
        code="USER_NOT_FOUND",
        message=f"User with id {user_id} does not exist."
    )
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-06-challenge',
        title: 'Global Exception Handler',
        description: 'Catch unexpected exceptions securely.',
        hint: 'Use @app.exception_handler(Exception).',
        solution: 'Do not leak stack traces to the client.',
        solutionCode: {
          id: '14-06-sol',
          language: 'python',
          title: 'Catch All',
          filename: 'handler.py',
          code: `@app.exception_handler(Exception)\nasync def global_handler(request, exc):\n    return JSONResponse(status_code=500, content={"code":"INTERNAL_ERROR"})`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '14-06-pn',
        severity: 'critical',
        content: 'Never leak database stack traces or internal implementation details in 500 error responses. Always log the real error internally and return a generic INTERNAL_SERVER_ERROR to the client.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'openapi-documentation': {
    id: '14-07',
    slug: 'openapi-documentation',
    chapterId: 14,
    order: 7,
    title: 'OpenAPI Documentation Excellence',
    description: 'Enrich Swagger/OpenAPI docs for developer experience.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.pydantic],
    prerequisites: [],
    objectives: [
      'Add operation descriptions and summaries',
      'Define request and response examples',
      'Document authentication schemes',
      'Generate client SDKs from OpenAPI spec'
    ],
    sections: [
      {
        id: '14-07-concept',
        type: 'concept',
        title: 'API Developer Experience',
        content: `FastAPI automatically generates an OpenAPI schema, but without explicit metadata, the documentation is barely usable for external developers. Great OpenAPI documentation includes summaries, detailed descriptions, parameter descriptions, and robust request/response examples.
        
Providing examples directly in Pydantic models ensures that the interactive Swagger UI populates with realistic data, making it easier for clients to test endpoints.`,
      },
      {
        id: '14-07-implementation',
        type: 'implementation',
        title: 'Enriching OpenAPI Metadata',
        content: `Use the \`Field\` and \`ConfigDict\` properties in Pydantic, alongside router metadata in FastAPI, to create excellent documentation.`,
        codeExample: {
          id: '14-07-code',
          language: 'python',
          title: 'Documented Models and Routes',
          filename: 'main.py',
          code: `from fastapi import FastAPI
from pydantic import BaseModel, Field, ConfigDict

app = FastAPI(
    title="Rocket API",
    description="API for launching rockets into orbit.",
    version="1.0.0"
)

class Rocket(BaseModel):
    name: str = Field(..., description="The name of the rocket model", examples=["Falcon 9"])
    payload_kg: int = Field(..., description="Max payload to LEO in kg", examples=[22800])
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Falcon 9",
                "payload_kg": 22800
            }
        }
    )

@app.post(
    "/rockets/",
    response_model=Rocket,
    summary="Create a new rocket",
    description="Registers a new rocket in the database so it can be scheduled for launches.",
    response_description="The created rocket object."
)
def create_rocket(rocket: Rocket):
    return rocket
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-07-challenge',
        title: 'Documenting Errors',
        description: 'How do you document the 404 error schema in OpenAPI?',
        hint: 'Use the \`responses\` parameter in the route decorator.',
        solution: 'Pass a dict with status codes and schemas to \`responses\`.',
        solutionCode: {
          id: '14-07-sol',
          language: 'python',
          title: 'Docs',
          filename: 'docs.py',
          code: `@app.get("/", responses={404: {"model": ErrorResponse}})`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'api-versioning-strategy': {
    id: '14-08',
    slug: 'api-versioning-strategy',
    chapterId: 14,
    order: 8,
    title: 'API Versioning Strategy',
    description: 'Maintain multiple API versions simultaneously.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Choose URL vs header vs content-type versioning',
      'Maintain multiple API versions simultaneously',
      'Document version differences',
      'Plan version sunset and deprecation'
    ],
    sections: [
      {
        id: '14-08-concept',
        type: 'concept',
        title: 'Versioning Approaches',
        content: `Once your API is public, you cannot introduce breaking changes without breaking client integrations. Versioning is required. There are three common ways to version an API: URL path (\`/v1/users\`), headers (\`X-API-Version: 2024-01-01\`), or Content Negotiation/Accept header (\`Accept: application/vnd.myapi.v1+json\`).
        
URL path versioning is the most pragmatic and easiest to cache, route, and test. While some argue it's not strictly RESTful, companies like Stripe use header-based versioning based on dates. For FastAPI, URL prefixing is the simplest approach to maintain.`,
      },
      {
        id: '14-08-implementation',
        type: 'implementation',
        title: 'URL Versioning in FastAPI',
        content: `By using API Routers, you can easily separate versions into different namespaces.`,
        codeExample: {
          id: '14-08-code',
          title: 'API Versioning Structure',
          files: {
            'app/api/v1/users.py': {
              language: 'python',
              code: `from fastapi import APIRouter
router = APIRouter(prefix="/v1/users")
@router.get("/")
def get_v1(): return {"version": "v1"}`
            },
            'app/api/v2/users.py': {
              language: 'python',
              code: `from fastapi import APIRouter
router = APIRouter(prefix="/v2/users")
@router.get("/")
def get_v2(): return {"version": "v2", "new_feature": True}`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI
from app.api.v1 import users as users_v1
from app.api.v2 import users as users_v2

app = FastAPI()
app.include_router(users_v1.router)
app.include_router(users_v2.router)
`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-08-challenge',
        title: 'Deprecating Endpoints',
        description: 'How do you signal an endpoint is deprecated in Swagger?',
        hint: 'Use the \`deprecated\` flag on the router.',
        solution: 'Set \`deprecated=True\` in the endpoint decorator.',
        solutionCode: {
          id: '14-08-sol',
          language: 'python',
          title: 'Deprecation',
          filename: 'dep.py',
          code: `@app.get("/old", deprecated=True)`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'backward-compatibility': {
    id: '14-09',
    slug: 'backward-compatibility',
    chapterId: 14,
    order: 9,
    title: 'Backward Compatibility',
    description: 'Evolve APIs safely without breaking clients.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.pydantic],
    prerequisites: [],
    objectives: [
      'List safe vs breaking changes',
      'Use additive-only schema evolution',
      'Test backward compatibility automatically',
      'Communicate changes to API consumers'
    ],
    sections: [
      {
        id: '14-09-concept',
        type: 'concept',
        title: 'Additive vs Breaking Changes',
        content: `A breaking change is any modification that causes existing clients to fail. Examples include: renaming fields, removing fields, changing a field's data type, or making an optional parameter required.
        
To maintain backward compatibility, changes should be strictly additive. Adding new endpoints, adding optional fields to request bodies, or adding new fields to a response (assuming the client ignores unknown fields) are generally safe. Always use tools to diff OpenAPI schemas in CI to catch accidental breaking changes.`,
      },
      {
        id: '14-09-implementation',
        type: 'implementation',
        title: 'Safe Schema Evolution',
        content: `When adding new fields to Pydantic models, ensure they have defaults so existing requests that do not provide them don't fail validation.`,
        codeExample: {
          id: '14-09-code',
          language: 'python',
          title: 'Additive Schema',
          filename: 'schemas.py',
          code: `from pydantic import BaseModel
from typing import Optional

# Old Version
# class UserCreate(BaseModel):
#     name: str
#     email: str

# New Version: Safely adding a new field without breaking existing clients
class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None  # Safe: Optional with default
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-09-challenge',
        title: 'Schema Diff',
        description: 'Identify if making a response field optional is breaking.',
        hint: 'If a client expects the field to always be there, what happens if it is suddenly null?',
        solution: 'Making a response field optional IS a breaking change because clients might encounter a null value where they expect a strict type.',
        solutionCode: {
          id: '14-09-sol',
          language: 'python',
          title: 'Solution',
          filename: 'concept.py',
          code: `# Making responses optional is breaking.`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '14-09-pn',
        severity: 'info',
        content: 'Use tools like \`openapi-diff\` in your CI pipeline to automatically detect and block PRs that introduce breaking changes to the Swagger spec.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'api-design-review': {
    id: '14-10',
    slug: 'api-design-review',
    chapterId: 14,
    order: 10,
    title: 'API Design Review & Common Mistakes',
    description: 'Identify chatty APIs and fix bad abstractions.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Identify chatty vs chunky API design',
      'Fix incorrect HTTP status code usage',
      'Stop leaking internal implementation details',
      'Design APIs for client developer experience'
    ],
    sections: [
      {
        id: '14-10-concept',
        type: 'concept',
        title: 'Chatty vs Chunky APIs',
        content: `A "chatty" API forces clients to make dozens of sequential requests to gather data for a single view. For example, getting a user, then calling a separate endpoint for their profile, and another for their settings. This adds severe network latency.
        
A "chunky" API provides aggregated responses, tailoring payloads to client needs (e.g., returning user, profile, and settings in one \`/users/me/dashboard\` call). While GraphQL solves this natively, REST APIs can achieve this by expanding resources via query params (\`?include=profile,settings\`) or building specific BFF (Backend for Frontend) endpoints.`,
      },
      {
        id: '14-10-implementation',
        type: 'implementation',
        title: 'Resource Expansion in FastAPI',
        content: `Instead of forcing multiple calls, allow clients to request expanded related resources dynamically.`,
        codeExample: {
          id: '14-10-code',
          language: 'python',
          title: 'Resource Expansion',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Query
from typing import Optional, List

app = FastAPI()

@app.get("/users/{user_id}")
def get_user(
    user_id: int, 
    include: Optional[str] = Query(None, description="Comma separated relations to include, e.g., 'profile,posts'")
):
    user_data = {"id": user_id, "name": "Alice"}
    
    if include:
        relations = [r.strip() for r in include.split(",")]
        if "profile" in relations:
            user_data["profile"] = {"bio": "FastAPI expert"}
        if "posts" in relations:
            user_data["posts"] = [{"id": 1, "title": "API Design"}]
            
    return user_data
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-10-challenge',
        title: 'Fix Status Codes',
        description: 'Return the right status code when a user fails authentication.',
        hint: '401 vs 403.',
        solution: 'Use 401 Unauthorized for bad credentials, 403 Forbidden for missing permissions.',
        solutionCode: {
          id: '14-10-sol',
          language: 'python',
          title: 'Auth errors',
          filename: 'auth.py',
          code: `raise HTTPException(status_code=401, detail="Invalid token")`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'webhook-design': {
    id: '14-11',
    slug: 'webhook-design',
    chapterId: 14,
    order: 11,
    title: 'Webhook Design & Delivery',
    description: 'Design secure and reliable webhook systems.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.celery, technologies.python],
    prerequisites: [],
    objectives: [
      'Design webhook payload schema',
      'Sign webhook payloads with HMAC',
      'Implement delivery retries with backoff',
      'Handle webhook consumer failures gracefully'
    ],
    sections: [
      {
        id: '14-11-concept',
        type: 'concept',
        title: 'Reliable Webhook Delivery',
        content: `Webhooks allow your application to push real-time events to other systems. However, designing webhooks introduces significant distributed systems challenges. What if the client's server is down? What if they take too long to respond?
        
To build a resilient webhook system, you must: decouple the sending logic using an asynchronous task queue (like Celery), implement exponential backoff for retries, enforce strict timeouts (e.g., 5 seconds), and sign the payload using HMAC so clients can verify the event actually came from your system.`,
      },
      {
        id: '14-11-implementation',
        type: 'implementation',
        title: 'Webhook Payload Signing',
        content: `Before sending a webhook, you must compute an HMAC signature using a shared secret and attach it to the headers.`,
        codeExample: {
          id: '14-11-code',
          language: 'python',
          title: 'Webhook Dispatch with HMAC',
          filename: 'webhooks.py',
          code: `import hmac
import hashlib
import json
import httpx

def send_webhook(url: str, secret: str, payload_dict: dict):
    # Serialize payload
    payload_body = json.dumps(payload_dict, separators=(',', ':'))
    
    # Compute signature
    signature = hmac.new(
        key=secret.encode('utf-8'),
        msg=payload_body.encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()
    
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": f"sha256={signature}"
    }
    
    # Use timeout to prevent hanging on slow clients
    with httpx.Client(timeout=5.0) as client:
        response = client.post(url, content=payload_body, headers=headers)
        response.raise_for_status()
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '14-11-challenge',
        title: 'Retry Logic',
        description: 'How do you handle a client returning a 500 error?',
        hint: 'Use Celery retry with exponential backoff.',
        solution: 'Catch the HTTP exception and retry the celery task.',
        solutionCode: {
          id: '14-11-sol',
          language: 'python',
          title: 'Celery Retry',
          filename: 'tasks.py',
          code: `@celery.task(bind=True, max_retries=5)\ndef deliver(self):\n    try: send_webhook()\n    except Exception as e: self.retry(exc=e, countdown=2**self.request.retries)`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '14-11-pn',
        severity: 'critical',
        content: 'Never send webhooks synchronously within an API request. A slow webhook consumer will exhaust your worker threads, causing your entire API to go down.'
      }
    ],
    realWorldScenarios: [
      {
        id: '14-11-rws',
        scenario: 'SSRF Attack via Webhooks',
        problem: 'A user provided an internal IP address (10.0.0.5) as their webhook URL, causing the webhook dispatcher to send requests to internal infrastructure behind the firewall.',
        solution: 'Implemented egress filtering and IP validation to block RFC1918 private network addresses in webhook configurations.'
      }
    ],
    commonMistakes: []
  }
};
