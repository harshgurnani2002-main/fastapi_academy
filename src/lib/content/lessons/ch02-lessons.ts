import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch02Lessons: Record<string, Lesson> = {
  'large-project-structure': {
    id: '02-01',
    slug: 'large-project-structure',
    chapterId: 2,
    order: 1,
    title: 'Large FastAPI Project Structure',
    description: 'Design a scalable project structure that supports a team of engineers working on different features simultaneously.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Choose between flat and feature-based structure',
      'Organize models, schemas, services, and routers',
      'Set up proper Python package structure',
      'Handle circular imports in large projects'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'Designing for Scale',
        content: `As FastAPI projects grow beyond a single main.py, the structure becomes the foundation of team velocity and system stability. A flat structure (all models in one file, all routers in another) quickly becomes a bottleneck when multiple engineers collaborate.\n\nThe key to a scalable structure is separation of concerns. You want to isolate HTTP routing from business logic, and business logic from database access. This is typically achieved through layers: Routers (API layer), Services (Business logic), and Repositories (Data access). However, in larger projects, organizing purely by layer can lead to high cognitive load, as developers must jump between multiple directories to understand a single feature.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'The Multi-Layer Architecture',
        content: `A structured project groups code into logical boundaries. The API layer handles request parsing and response formatting. The Service layer contains the core business rules and orchestration. The Data layer manages database interactions.\n\nCircular imports are a common pitfall in Python when structures aren't well thought out. By ensuring dependencies flow downwards (Routers -> Services -> Models) and avoiding bidirectional dependencies, you can keep the codebase maintainable. Using dependency injection extensively also helps decouple these layers.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Implementing the Structure',
        content: `Here is a foundational structure for a FastAPI application that separates configurations, database setup, and feature modules.`,
        codeExample: {
          id: 'ce1',
          title: 'Project Structure',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI\nfrom app.api.v1.api import api_router\nfrom app.core.config import settings\n\napp = FastAPI(title=settings.PROJECT_NAME)\napp.include_router(api_router, prefix=settings.API_V1_STR)\n`
            },
            'app/core/config.py': {
              language: 'python',
              code: `from pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    PROJECT_NAME: str = "FastAPI Academy"\n    API_V1_STR: str = "/api/v1"\n\nsettings = Settings()`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_proj',
        title: 'Standard Enterprise Structure',
        files: {
          'app/api/v1/endpoints/users.py': {
            language: 'python',
            code: `from fastapi import APIRouter, Depends\nfrom app.services import user_service\nfrom app.schemas.user import UserResponse\n\nrouter = APIRouter()\n\n@router.get("/{user_id}", response_model=UserResponse)\ndef get_user(user_id: int):\n    return user_service.get_user(user_id)\n`
          },
          'app/services/user_service.py': {
            language: 'python',
            code: `def get_user(user_id: int):\n    # Business logic here\n    return {"id": user_id, "name": "Alice"}`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Refactor to Layered Architecture',
        description: 'Take a monolithic main.py file and extract the routing, business logic, and database operations into their respective layers.',
        hint: 'Start by pulling out the database models, then the Pydantic schemas, and finally move the logic into a service class.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Refactored Service',
          filename: 'user_service.py',
          code: `class UserService:\n    def get_user(self, user_id: int):\n        pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'How do you prevent circular imports in a large Python project?',
        answer: 'You avoid circular imports by structuring dependencies in a directed acyclic graph (DAG). Ensure that lower-level modules (like models) do not import from higher-level modules (like routers or services). You can also use TYPE_CHECKING from typing for type hints.',
        difficulty: 'advanced'
      },
      {
        id: 'iq2',
        question: 'Why separate business logic from the FastAPI router?',
        answer: 'Separating business logic makes the code testable without an HTTP context, allows reusing the same logic in different entry points (like background workers or CLI tools), and keeps the router focused solely on HTTP concerns.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'warning',
        content: 'Avoid putting heavy business logic directly in database model properties or methods. It makes them hard to serialize and tightly couples the domain to the ORM.'
      },
      {
        id: 'pn2',
        severity: 'info',
        content: 'Use an `__init__.py` in each directory to explicitly define the public API of that module, which reduces the need for deep imports.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Monolith Bottleneck',
        problem: 'A team of 10 developers was constantly facing merge conflicts in `main.py` and `models.py` because all features were added there.',
        solution: 'Refactored the codebase into a feature-based structure where each domain had its own folder, completely eliminating file contention.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'God Files',
        description: 'Putting all database models or API routes into a single file.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `# models.py with 5000 lines of code\nclass User(Base):\n    ...\nclass Order(Base):\n    ...`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `# app/models/user.py\nclass User(Base):\n    ...\n# app/models/order.py\nclass Order(Base):\n    ...`
        }
      }
    ]
  },
  'feature-based-architecture': {
    id: '02-02',
    slug: 'feature-based-architecture',
    chapterId: 2,
    order: 2,
    title: 'Feature-Based Architecture',
    description: 'Organize code around business features (users, orders, payments) rather than technical layers.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['02-01'],
    objectives: [
      'Structure features as self-contained modules',
      'Share code between features correctly',
      'Manage cross-cutting concerns',
      'Scale teams with feature ownership'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'Shifting to Domain-Driven Organization',
        content: `While layering separates technical concerns (API vs Database), feature-based organization groups code by business domains. Instead of having a \`models/\` folder with all tables and a \`routers/\` folder with all endpoints, you have a \`users/\` folder containing its own models, schemas, routers, and services.\n\nThis approach mirrors Domain-Driven Design (DDD). It makes it vastly easier for developers to work on a specific feature since everything related to that feature is in one place. It also paves the way for eventually breaking a monolith into microservices, as the boundaries are already established.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Isolating Feature Boundaries',
        content: `The primary challenge with feature-based structures is handling cross-domain dependencies. What if the Orders feature needs to know about Users? Instead of directly importing the User model into the Orders service, features should communicate through well-defined public interfaces or service layers.\n\nShared code, such as authentication middleware or base database classes, belongs in a central \`core/\` or \`shared/\` module. The rule of thumb is: if it's used by multiple features but doesn't belong to any specific one, it's shared infrastructure.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Implementing a Feature Module',
        content: `A typical feature directory contains everything needed to run that specific domain.`,
        codeExample: {
          id: 'ce1',
          title: 'Feature Directory',
          files: {
            'app/domain/orders/router.py': {
              language: 'python',
              code: `from fastapi import APIRouter\nfrom .service import OrderService\n\nrouter = APIRouter()\n\n@router.post("/")\ndef create_order():\n    pass`
            },
            'app/domain/orders/models.py': {
              language: 'python',
              code: `from app.core.database import Base\nfrom sqlalchemy import Column, Integer\n\nclass Order(Base):\n    __tablename__ = "orders"\n    id = Column(Integer, primary_key=True)`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_feat',
        title: 'Inter-domain Communication',
        files: {
          'app/domain/orders/service.py': {
            language: 'python',
            code: `from app.domain.users.service import get_user_status\n\nclass OrderService:\n    def create(self, user_id: int):\n        if not get_user_status(user_id):\n            raise Exception("User inactive")\n        return "Order created"`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Refactor to Features',
        description: 'Convert a layered architecture into a feature-based one for a simple e-commerce app.',
        hint: 'Group all models, schemas, and endpoints related to Products into an `app/products/` folder.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Product Router',
          filename: 'app/products/router.py',
          code: `from fastapi import APIRouter\nrouter = APIRouter()`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'What are the pros and cons of feature-based architecture compared to layer-based?',
        answer: 'Pros include higher cohesion, easier onboarding for new developers on a specific domain, and a clearer path to microservices. Cons include potential complexity in sharing code across features and difficulty in enforcing consistent architectural layers within each feature.',
        difficulty: 'advanced'
      },
      {
        id: 'iq2',
        question: 'How do you handle database relationships across different feature modules?',
        answer: 'You can use late imports, string-based relationships in SQLAlchemy (`relationship("User")`), or define an abstract base class. Alternatively, avoid tight DB coupling and use service-level integration instead.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'info',
        content: 'Create a strict rule: a feature module can import from another feature module\'s service layer, but NEVER from its database or models directly.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Tangled Web',
        problem: 'Features were deeply coupled at the database level, making it impossible to separate the system later.',
        solution: 'Introduced strict service boundaries and used event-driven communication for cross-domain updates.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Leaking Domain Models',
        description: 'Returning database models from one feature directly to another, coupling them to internal structures.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `def get_order_user(order):\n    return order.user_model_instance`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `def get_order_user(order):\n    return UserDTO.from_orm(order.user_model_instance)`
        }
      }
    ]
  },
  'configuration-environment': {
    id: '02-03',
    slug: 'configuration-environment',
    chapterId: 2,
    order: 3,
    title: 'Configuration & Environment Management',
    description: 'Manage development, staging, and production configurations safely with pydantic-settings.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.pydantic, technologies.python],
    prerequisites: [],
    objectives: [
      'Use pydantic-settings for all config',
      'Separate settings by environment',
      'Validate configuration on startup',
      'Handle missing required variables gracefully'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'Type-Safe Configuration',
        content: `Configuration is often treated as an afterthought, with developers using os.getenv() scattered throughout the codebase. This leads to hidden bugs where a missing environment variable only crashes the app when a specific code path is hit.\n\npydantic-settings revolutionizes this by loading, typing, and validating all configurations at application startup. If a required variable is missing or malformed (e.g., passing a string to an integer port setting), the application fails immediately during boot, preventing unpredictable runtime states.`
      },
      {
        id: 's2',
        type: 'implementation',
        title: 'Implementing pydantic-settings',
        content: `You can define your settings schema as a Pydantic model. It will automatically read from environment variables or a .env file.`,
        codeExample: {
          id: 'ce1',
          title: 'Settings Model',
          files: {
            'app/core/config.py': {
              language: 'python',
              code: `from pydantic_settings import BaseSettings, SettingsConfigDict\nfrom pydantic import PostgresDsn, SecretStr\n\nclass Settings(BaseSettings):\n    PROJECT_NAME: str = "My API"\n    DATABASE_URL: PostgresDsn\n    API_KEY: SecretStr\n    \n    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")\n\nsettings = Settings()`
            }
          }
        }
      },
      {
        id: 's3',
        type: 'production',
        title: 'Environment Separation',
        content: `In production, you rarely rely on .env files. Instead, configurations are injected via Kubernetes ConfigMaps, Docker environments, or CI/CD pipelines. Using BaseSettings ensures your app works seamlessly across all these environments by prioritizing OS environment variables over .env files.`
      }
    ],
    codeExamples: [
      {
        id: 'ce_config',
        title: 'Advanced Settings validation',
        files: {
          'app/core/config.py': {
            language: 'python',
            code: `from typing import Literal\nfrom pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    ENVIRONMENT: Literal["local", "staging", "production"] = "local"\n    DEBUG: bool = False\n\n    def is_production(self) -> bool:\n        return self.ENVIRONMENT == "production"`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Build a Config Validator',
        description: 'Create a Pydantic Settings class that requires a Redis URL, a list of allowed CORS origins, and an admin email.',
        hint: 'Use AnyHttpUrl for the CORS origins list.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Config Schema',
          filename: 'config.py',
          code: `from pydantic_settings import BaseSettings\nfrom pydantic import RedisDsn, AnyHttpUrl, EmailStr\n\nclass Settings(BaseSettings):\n    REDIS_URL: RedisDsn\n    CORS_ORIGINS: list[AnyHttpUrl]\n    ADMIN_EMAIL: EmailStr`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'Why is fail-fast configuration important?',
        answer: 'Fail-fast configuration ensures that an application does not start if its environment is incorrectly configured. This prevents partial functionality, corrupted states, and unexpected downtime when the missing config is finally accessed.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq2',
        question: 'How does Pydantic handle sensitive information like passwords in settings?',
        answer: 'Pydantic provides the `SecretStr` and `SecretBytes` types. These prevent the sensitive values from being accidentally printed or logged by masking their string representation.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'critical',
        content: 'Never commit your .env files to version control. Always include it in your .gitignore.'
      },
      {
        id: 'pn2',
        severity: 'info',
        content: 'Cache the instantiation of your Settings class using functools.lru_cache if you rely on dependency injection for settings, to avoid re-reading files on every request.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Silent Crash',
        problem: 'An app deployed to staging worked, but crashed on production because an obscure third-party API key was missing. The bug triggered only during a nightly cron job.',
        solution: 'Migrated to pydantic-settings. The missing key was immediately caught during deployment boot, forcing the DevOps team to supply the missing secret.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Using os.getenv directly',
        description: 'Fetching config values dynamically at runtime.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `import os\ndef connect_db():\n    url = os.getenv("DB_URL")\n    # Fails later if None`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `from app.core.config import settings\ndef connect_db():\n    url = settings.DATABASE_URL`
        }
      }
    ]
  },
  'structured-logging': {
    id: '02-04',
    slug: 'structured-logging',
    chapterId: 2,
    order: 4,
    title: 'Structured Logging & Observability Foundations',
    description: 'Set up structured JSON logging with correlation IDs, request context, and log levels from day one.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Configure structlog or loguru for JSON output',
      'Add request ID and user ID to log context',
      'Set appropriate log levels per environment',
      'Avoid logging sensitive data'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'Beyond Print Statements',
        content: `Standard text-based logging is sufficient for small scripts, but in production systems, logs are consumed by machines (like Elasticsearch, Datadog, or CloudWatch). Unstructured text requires complex regex parsing to extract metrics.\n\nStructured logging outputs logs as JSON objects. Every log entry includes a timestamp, level, message, and crucially, contextual metadata. This metadata transforms logs from a chronological stream of text into queryable datasets.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Contextual Logging with Correlation IDs',
        content: `In an API, multiple requests are handled concurrently. If you log an error deep in a service layer, you need to know which HTTP request triggered it. By generating a Correlation ID (or Request ID) at the middleware layer and binding it to the logging context using ContextVars, every subsequent log entry automatically includes that ID. You can then trace a single request's entire journey.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Implementing Structlog in FastAPI',
        content: `Here's how you set up structlog with context variables in FastAPI.`,
        codeExample: {
          id: 'ce1',
          title: 'Structlog Setup',
          files: {
            'app/core/logger.py': {
              language: 'python',
              code: `import structlog\n\nstructlog.configure(\n    processors=[\n        structlog.contextvars.merge_contextvars,\n        structlog.processors.JSONRenderer()\n    ]\n)\nlogger = structlog.get_logger()`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Request\nimport uuid\nimport structlog\nfrom app.core.logger import logger\n\napp = FastAPI()\n\n@app.middleware("http")\nasync def add_correlation_id(request: Request, call_next):\n    request_id = str(uuid.uuid4())\n    structlog.contextvars.clear_contextvars()\n    structlog.contextvars.bind_contextvars(request_id=request_id)\n    response = await call_next(request)\n    return response`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_logs',
        title: 'Using the Logger',
        files: {
          'app/services/payment.py': {
            language: 'python',
            code: `from app.core.logger import logger\n\ndef process_payment(amount: float):\n    logger.info("processing_payment", amount=amount)\n    try:\n        # process\n        logger.info("payment_successful")\n    except Exception as e:\n        logger.error("payment_failed", error=str(e))`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Add User Context to Logs',
        description: 'Modify the middleware to extract a user_id from a hypothetical authorization header and bind it to the structured log context.',
        hint: 'Use structlog.contextvars.bind_contextvars(user_id=user_id).',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'User Context Middleware',
          filename: 'middleware.py',
          code: `user_id = request.headers.get("X-User-ID", "anonymous")\nstructlog.contextvars.bind_contextvars(user_id=user_id)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'What is a Correlation ID and why is it essential in microservices?',
        answer: 'A Correlation ID is a unique identifier attached to a specific request. It is essential because it is passed along to all downstream services and logged at every step, allowing engineers to trace the complete lifecycle of a request across a distributed system.',
        difficulty: 'advanced'
      },
      {
        id: 'iq2',
        question: 'How do ContextVars in Python differ from Thread-Local storage?',
        answer: 'ContextVars are designed to work correctly with asynchronous code (asyncio), whereas Thread-Local storage can leak state across concurrent async tasks running on the same thread. ContextVars maintain their context seamlessly across `await` yields.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'critical',
        content: 'Never log PII (Personally Identifiable Information), passwords, or secrets. Implement log scrubbers or processors that mask sensitive fields like "password" or "credit_card".'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Debugging Nightmare',
        problem: 'A payment gateway integration was failing randomly. The logs just showed "Connection Timeout", but engineers couldn\'t tell which user or transaction was affected.',
        solution: 'Implemented structured logging with transaction IDs. The next time it failed, they immediately queried Elasticsearch for the transaction ID and found the exact payload that caused the timeout.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'String Interpolation in Logs',
        description: 'Baking variables into the log message string rather than passing them as kwargs.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `logger.info(f"User {user_id} logged in from {ip}")`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `logger.info("user_logged_in", user_id=user_id, ip_address=ip)`
        }
      }
    ]
  },
  'error-handling-patterns': {
    id: '02-05',
    slug: 'error-handling-patterns',
    chapterId: 2,
    order: 5,
    title: 'Error Handling & Custom Exceptions',
    description: 'Build a consistent error handling system with custom exceptions, error codes, and structured error responses.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.pydantic],
    prerequisites: [],
    objectives: [
      'Define a custom exception hierarchy',
      'Create consistent API error response schemas',
      'Register global exception handlers',
      'Map domain errors to HTTP status codes'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'Centralized Error Management',
        content: `In a robust API, error responses must be uniform. If a client receives a 404, the payload structure should be identical to when they receive a 400. Inconsistent error structures force frontend developers to write complex, fragile error parsing logic.\n\nFastAPI allows you to capture exceptions globally using exception handlers. By defining a custom hierarchy of domain exceptions (e.g., DomainException, NotFoundException, ValidationException), you can throw these errors anywhere in your service layers and have the API layer automatically translate them into standard HTTP responses.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Decoupling Domain Errors from HTTP',
        content: `Your business logic (Service layer) should not know about HTTP status codes. Raising an HTTPException(status_code=404) inside a service violates this separation of concerns. Instead, the service should raise a generic EntityNotFound error. The exception handler registered in the FastAPI app then maps EntityNotFound to a 404 HTTP response.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Custom Exception Hierarchy',
        content: `Create custom exceptions and register handlers to standardize outputs.`,
        codeExample: {
          id: 'ce1',
          title: 'Exception Handling',
          files: {
            'app/core/exceptions.py': {
              language: 'python',
              code: `class AppError(Exception):\n    def __init__(self, message: str, code: str):\n        self.message = message\n        self.code = code\n\nclass NotFoundError(AppError):\n    def __init__(self, entity: str):\n        super().__init__(f"{entity} not found", "NOT_FOUND")`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Request\nfrom fastapi.responses import JSONResponse\nfrom app.core.exceptions import AppError\n\napp = FastAPI()\n\n@app.exception_handler(AppError)\nasync def app_error_handler(request: Request, exc: AppError):\n    return JSONResponse(\n        status_code=400, # or map based on error type\n        content={"error": {"code": exc.code, "message": exc.message}}\n    )`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_errors',
        title: 'Clean Service Logic',
        files: {
          'app/services/user.py': {
            language: 'python',
            code: `from app.core.exceptions import NotFoundError\n\ndef get_user(user_id: int):\n    user = db.query(User).get(user_id)\n    if not user:\n        raise NotFoundError("User")\n    return user`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Status Code Mapping',
        description: 'Modify the exception handler to dynamically map different subclasses of AppError to the appropriate HTTP status code.',
        hint: 'You can add a `status_code` attribute to your exception classes.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Status Code Mapping',
          filename: 'exceptions.py',
          code: `class AppError(Exception):\n    status_code: int = 400\n\nclass NotFoundError(AppError):\n    status_code = 404`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'Why should services not raise FastAPI `HTTPException` directly?',
        answer: 'Raising HTTPExceptions tightly couples the business logic to the HTTP transport layer. It makes the service harder to test in isolation, prevents reuse in non-HTTP contexts (like Celery workers), and violates the Single Responsibility Principle.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'warning',
        content: 'When handling 500 Internal Server Errors globally, never expose the raw stack trace or exception message to the client. Log the full error internally, but return a generic "An unexpected error occurred" message.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Frontend Parsing Hell',
        problem: 'The API returned errors as plain strings in some cases, Pydantic validation errors in others, and custom JSON in others. The frontend had 500 lines of spaghetti code just to parse errors.',
        solution: 'Implemented a global exception handler that forced every single error, including 422 Validation Errors, into a standard `{ "error": { "code": "...", "message": "..." } }` envelope.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Leaking HTTP logic to Services',
        description: 'Using HTTPException in business logic.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `from fastapi import HTTPException\ndef update_user():\n    raise HTTPException(status_code=404)`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `from app.core.exceptions import NotFoundError\ndef update_user():\n    raise NotFoundError("User")`
        }
      }
    ]
  },
  'api-versioning': {
    id: '02-06',
    slug: 'api-versioning',
    chapterId: 2,
    order: 6,
    title: 'API Versioning Strategies',
    description: 'Implement backward-compatible API versioning to support long-lived APIs and multiple client versions.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'Compare URL, header, and query param versioning',
      'Implement router-based versioning in FastAPI',
      'Maintain backward compatibility',
      'Deprecate old versions gracefully'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'The Necessity of Versioning',
        content: `Once your API is in production and consumed by external clients or mobile apps, changing the response schema or route parameters can break client applications. API versioning is the practice of maintaining multiple versions of your API simultaneously, allowing clients to migrate at their own pace.\n\nThere are three common strategies: URL path versioning (\`/v1/users\`), Header versioning (\`Accept: application/vnd.myapi.v1+json\`), and Query parameter versioning (\`?version=1\`). URL path versioning is the most common and pragmatic choice as it is visible, easily cachable, and intuitive.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Router-based Versioning',
        content: `In FastAPI, URL versioning is easily achieved using the \`APIRouter\` prefix feature. You create separate routers for \`v1\` and \`v2\`. To avoid massive code duplication, the underlying service logic often remains the same, but the API layer defines different request/response schemas or adapter logic to handle the differences between versions.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Implementing v1 and v2 Routers',
        content: `Setting up versioned prefixes.`,
        codeExample: {
          id: 'ce1',
          title: 'Router Versioning',
          files: {
            'app/api/v1/users.py': {
              language: 'python',
              code: `from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/")\ndef get_users(): return [{"username": "alice"}]`
            },
            'app/api/v2/users.py': {
              language: 'python',
              code: `from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/")\ndef get_users(): return [{"first_name": "Alice", "last_name": "Smith"}]`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI\nfrom app.api.v1.users import router as v1_router\nfrom app.api.v2.users import router as v2_router\n\napp = FastAPI()\napp.include_router(v1_router, prefix="/api/v1/users")\napp.include_router(v2_router, prefix="/api/v2/users")`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_vers',
        title: 'Sharing Business Logic',
        files: {
          'app/api/v1/users.py': {
            language: 'python',
            code: `from app.services.user import get_all_users\n# Map domain model to v1 schema`
          },
          'app/api/v2/users.py': {
            language: 'python',
            code: `from app.services.user import get_all_users\n# Map domain model to v2 schema`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Deprecation Headers',
        description: 'Add a custom middleware or dependency to v1 routes that injects a `Deprecation` and `Link` HTTP header warning clients that v1 is deprecated.',
        hint: 'Use a router-level dependency to add headers to the response.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Deprecation Dependency',
          filename: 'deps.py',
          code: `from fastapi import Response\ndef add_deprecation_header(response: Response):\n    response.headers["Deprecation"] = "true"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'What constitutes a breaking change in a REST API?',
        answer: 'Removing a field from a response, changing the data type of a field, adding a new required request parameter, or changing HTTP status codes for existing errors are all breaking changes that warrant a new API version.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'info',
        content: 'Adding new fields to a JSON response is generally NOT considered a breaking change. Well-written clients should ignore unrecognized fields.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Mobile App Nightmare',
        problem: 'An API field was renamed from `user_name` to `username`. It instantly crashed the iOS app for millions of users because mobile clients cannot be forced to update immediately.',
        solution: 'Reverted the change. Created a `/v2/` API endpoint with the new schema, and configured the new app release to point to `/v2/` while leaving `/v1/` intact for older installs.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Duplicating Business Logic',
        description: 'Copy-pasting entire service files when creating a new API version.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `# Creating v2_service.py by copying v1_service.py`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `# Using the same core service, but adapting the I/O schemas at the router level.`
        }
      }
    ]
  },
  'type-checking-mypy': {
    id: '02-07',
    slug: 'type-checking-mypy',
    chapterId: 2,
    order: 7,
    title: 'Type Checking with MyPy',
    description: 'Configure MyPy for strict type checking in FastAPI projects and eliminate a whole class of runtime errors.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.python],
    prerequisites: [],
    objectives: [
      'Configure mypy.ini for FastAPI projects',
      'Type annotate all function signatures',
      'Handle Optional, Union, and Generic types',
      'Use type: ignore sparingly and document why'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'Static Typing in Python',
        content: `Python is dynamically typed, which allows rapid development but often leads to runtime errors like \`AttributeError\` or \`TypeError\`. Static type checking tools like MyPy analyze your code without executing it, ensuring that functions are called with the correct arguments and return the expected types.\n\nFastAPI inherently encourages type hints because it uses them for Pydantic validation and OpenAPI generation. By running MyPy in your CI pipeline, you ensure that your type hints are actually correct, effectively eliminating a massive category of bugs before they reach production.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Strict Mode Configuration',
        content: `Running MyPy out of the box on an existing codebase can yield thousands of errors. The best approach is to configure MyPy to be strict on new modules while gradually migrating older ones. Settings like \`disallow_untyped_defs\` and \`warn_return_any\` force developers to be explicit about their types, preventing type safety from regressing.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Configuring MyPy',
        content: `Set up a pyproject.toml or mypy.ini with strict settings.`,
        codeExample: {
          id: 'ce1',
          title: 'MyPy Config',
          files: {
            'pyproject.toml': {
              language: 'toml',
              code: `[tool.mypy]\nplugins = ["pydantic.mypy"]\nstrict = true\nwarn_return_any = true\ndisallow_untyped_defs = true\nignore_missing_imports = true`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_types',
        title: 'Proper Typing',
        files: {
          'app/utils.py': {
            language: 'python',
            code: `from typing import Optional\n\ndef get_user_email(user_id: int) -> Optional[str]:\n    return "test@example.com" # or None`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Fix the Type Error',
        description: 'A function expects a list of dictionaries, but MyPy is complaining about `Any`. Provide the correct typing construct.',
        hint: 'Use `list[dict[str, Any]]` or define a TypedDict.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Proper Dict Type',
          filename: 'types.py',
          code: `from typing import Any\ndef process(data: list[dict[str, Any]]) -> None: pass`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'What is the difference between `Any` and `object` in MyPy?',
        answer: '`Any` is an escape hatch that turns off type checking for that value; you can call any method on it without a MyPy error. `object` is the base class for all types, so MyPy will only allow you to call methods that exist on `object` itself (like `__str__`), providing stricter safety.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'warning',
        content: 'When using SQLAlchemy 2.0 with MyPy, ensure you use the Mapped type hints (`Mapped[str]`) for models to get full static type safety on your ORM objects.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The NoneType Exception',
        problem: 'A background worker crashed processing millions of records because a database fetch returned `None` instead of a model, throwing `AttributeError: \'NoneType\' object has no attribute \'id\'.`',
        solution: 'Enabled strict MyPy. It immediately flagged the function return type as `Optional[Model]`, forcing the developer to handle the `None` case explicitly.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Ignoring Types Instead of Fixing',
        description: 'Using `# type: ignore` everywhere instead of actually defining types.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `val = process_data() # type: ignore`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `val: dict[str, str] = process_data()`
        }
      }
    ]
  },
  'code-quality-ruff': {
    id: '02-08',
    slug: 'code-quality-ruff',
    chapterId: 2,
    order: 8,
    title: 'Code Quality with Ruff & Pre-commit',
    description: 'Set up Ruff for blazing-fast linting and formatting, and pre-commit hooks to enforce standards automatically.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.python],
    prerequisites: [],
    objectives: [
      'Configure Ruff rules for FastAPI projects',
      'Set up pre-commit with ruff, mypy, and tests',
      'Integrate code quality in CI pipeline',
      'Fix common Ruff violations efficiently'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'The Need for Speed in Linting',
        content: `Historically, Python projects used a combination of Flake8, Black, isort, and other tools to enforce code quality. Running these in large projects could take minutes. Ruff is an extremely fast Python linter and formatter written in Rust that replaces almost all of these tools, executing in milliseconds.\n\nEnforcing these standards manually is prone to human error. Developers forget to run the linter before pushing code, leading to failed CI pipelines and wasted time. Pre-commit hooks solve this by automatically running your quality checks every time you type \`git commit\`.`
      },
      {
        id: 's2',
        type: 'implementation',
        title: 'Configuring Ruff',
        content: `Ruff can be configured via pyproject.toml to enable a vast array of rules.`,
        codeExample: {
          id: 'ce1',
          title: 'Ruff Config',
          files: {
            'pyproject.toml': {
              language: 'toml',
              code: `[tool.ruff]\nline-length = 88\ntarget-version = "py311"\n\n[tool.ruff.lint]\nselect = ["E", "F", "I", "B"] # pycodestyle, pyflakes, isort, flake8-bugbear\nignore = []`
            }
          }
        }
      },
      {
        id: 's3',
        type: 'architecture',
        title: 'Pre-Commit Integration',
        content: `Integrating Ruff into pre-commit ensures nobody can push unformatted code.`
      }
    ],
    codeExamples: [
      {
        id: 'ce_precommit',
        title: 'Pre-commit config',
        files: {
          '.pre-commit-config.yaml': {
            language: 'yaml',
            code: `repos:\n  - repo: https://github.com/astral-sh/ruff-pre-commit\n    rev: v0.1.0\n    hooks:\n      - id: ruff\n        args: [--fix]\n      - id: ruff-format`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Fix Unused Imports',
        description: 'Configure Ruff to automatically remove unused imports instead of just warning about them.',
        hint: 'You can use the --fix flag in your pre-commit config.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'yaml',
          title: 'Auto-fix config',
          filename: '.pre-commit-config.yaml',
          code: `args: [--fix, --exit-non-zero-on-fix]`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'Why is an auto-formatter like Ruff/Black important for engineering teams?',
        answer: 'Auto-formatters eliminate subjective arguments about code style during pull requests. By enforcing a strict, automated style, reviewers can focus on the logic and architecture rather than formatting choices, saving significant engineering time.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'info',
        content: 'Always run your linters in the CI/CD pipeline (e.g., GitHub Actions) as well, because pre-commit hooks can be bypassed locally with `git commit --no-verify`.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Endless PR Debate',
        problem: 'A team spent hours arguing on PRs over single quotes vs double quotes and import ordering.',
        solution: 'Introduced Ruff formatting and pre-commit. All style issues were fixed automatically on commit, reducing PR review time by 30%.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Ignoring Linter Errors',
        description: 'Adding noqa comments indiscriminately to bypass warnings rather than fixing the underlying issue.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `import os  # noqa: F401`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `# Just remove the unused import entirely.`
        }
      }
    ]
  },
  'dependency-management-uv': {
    id: '02-09',
    slug: 'dependency-management-uv',
    chapterId: 2,
    order: 9,
    title: 'Dependency Management with uv & Poetry',
    description: 'Use modern Python dependency management tools for fast, reproducible installs and virtual environment management.',
    duration: 30,
    difficulty: 'advanced',
    technologies: [technologies.python],
    prerequisites: [],
    objectives: [
      'Use uv for fast dependency resolution',
      'Structure pyproject.toml correctly',
      'Pin dependencies for reproducible builds',
      'Separate dev from production dependencies'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'The Evolution of Packaging',
        content: `Traditional Python dependency management relied on \`requirements.txt\` and \`pip\`. This approach often leads to "dependency hell" because it doesn't lock transitive dependencies (the dependencies of your dependencies). If a sub-dependency releases a breaking change, your app might break even if you didn't change anything.\n\nTools like Poetry and uv solve this by separating your abstract dependencies (defined in pyproject.toml) from your locked dependencies (a lockfile). The lockfile guarantees that every machine installing the project gets the exact same versions of every package, ensuring reproducible builds.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Enter uv',
        content: `uv is an ultra-fast Python package installer and resolver written in Rust. It acts as a drop-in replacement for pip and pip-tools but is significantly faster. It allows you to compile your \`pyproject.toml\` into a strict \`requirements.txt\` lockfile in milliseconds.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Setting up pyproject.toml',
        content: `Define your project dependencies cleanly.`,
        codeExample: {
          id: 'ce1',
          title: 'Dependencies',
          files: {
            'pyproject.toml': {
              language: 'toml',
              code: `[project]\nname = "fastapi-app"\nversion = "0.1.0"\ndependencies = [\n    "fastapi>=0.100.0",\n    "uvicorn[standard]"\n]\n\n[project.optional-dependencies]\ndev = [\n    "pytest",\n    "ruff",\n    "mypy"\n]`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_uv',
        title: 'Locking with uv',
        files: {
          'Makefile': {
            language: 'makefile',
            code: `lock:\n\tuv pip compile pyproject.toml -o requirements.txt\n\tuv pip compile pyproject.toml --extra dev -o requirements-dev.txt\n\ninstall:\n\tuv pip sync requirements.txt requirements-dev.txt`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Separate Environments',
        description: 'Explain how to compile a requirements file that ONLY contains production dependencies, excluding testing libraries.',
        hint: 'Look at how `uv pip compile` handles the default pyproject.toml without the --extra flag.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'bash',
          title: 'Prod Lockfile',
          filename: 'cmd.sh',
          code: `uv pip compile pyproject.toml -o requirements-prod.txt`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'What is a lockfile and why is it critical for deployment?',
        answer: 'A lockfile records the exact versions and cryptographic hashes of every direct and transitive dependency installed. It is critical because it guarantees that your production environment runs the exact same code that was tested in CI, preventing unexpected breakages from upstream package updates.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'critical',
        content: 'When building Docker images for production, always use your locked files (e.g., `uv pip install -r requirements.txt`) rather than resolving dependencies dynamically during the build.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Friday Deployment Failure',
        problem: 'A developer deployed a hotfix on Friday. The app crashed on boot because a transitive dependency (urllib3) released a new major version an hour earlier, which pip cheerfully installed.',
        solution: 'Moved to a lockfile system. Dependencies are now explicitly locked and can only be updated intentionally via a PR.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Committing Environment Folders',
        description: 'Adding the `venv/` or `.env` folder into Git.',
        badCode: {
          id: 'bad1',
          language: 'bash',
          title: '❌ Wrong Way',
          code: `git add venv/`
        },
        goodCode: {
          id: 'good1',
          language: 'bash',
          title: '✅ Correct Way',
          code: `echo "venv/" >> .gitignore`
        }
      }
    ]
  },
  'response-envelopes-schemas': {
    id: '02-10',
    slug: 'response-envelopes-schemas',
    chapterId: 2,
    order: 10,
    title: 'Response Envelopes & Schema Design',
    description: 'Design consistent API response schemas with pagination, metadata, and error envelopes that clients can rely on.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.pydantic],
    prerequisites: [],
    objectives: [
      'Design a unified response envelope schema',
      'Implement paginated list responses',
      'Return consistent error response format',
      'Version your response schemas'
    ],
    sections: [
      {
        id: 's1',
        type: 'concept',
        title: 'The Value of Consistency',
        content: `When a frontend client consumes an API, it relies on predictability. If one endpoint returns a raw list \`[...]\` and another returns an object \`{"data": [...]}\`, the client code becomes overly complex. \n\nA Response Envelope wraps all API responses in a standardized format. It typically includes the payload in a \`data\` field, operational info in a \`meta\` field (like pagination), and error details in an \`error\` field. This allows frontend interceptors to process responses uniformly.`
      },
      {
        id: 's2',
        type: 'architecture',
        title: 'Generic Models in Pydantic',
        content: `Creating a separate envelope model for every resource is tedious. Pydantic supports Python's Generic typing, allowing you to define a single \`ResponseEnvelope[T]\` where \`T\` is dynamically replaced by your specific schema (e.g., \`ResponseEnvelope[UserSchema]\`). This provides full IDE and OpenAPI typing support without code duplication.`
      },
      {
        id: 's3',
        type: 'implementation',
        title: 'Building a Generic Envelope',
        content: `Here is how to implement generic Pydantic models for your API.`,
        codeExample: {
          id: 'ce1',
          title: 'Generic Envelope',
          files: {
            'app/schemas/core.py': {
              language: 'python',
              code: `from typing import Generic, TypeVar, Optional\nfrom pydantic import BaseModel\n\nT = TypeVar('T')\n\nclass ResponseEnvelope(BaseModel, Generic[T]):\n    data: Optional[T] = None\n    meta: Optional[dict] = None\n    success: bool = True`
            },
            'app/api/users.py': {
              language: 'python',
              code: `from fastapi import APIRouter\nfrom app.schemas.core import ResponseEnvelope\nfrom app.schemas.user import UserOut\n\nrouter = APIRouter()\n\n@router.get("/{id}", response_model=ResponseEnvelope[UserOut])\ndef get_user(id: int):\n    user = {"id": id, "name": "Alice"}\n    return ResponseEnvelope(data=user)`
            }
          }
        }
      }
    ],
    codeExamples: [
      {
        id: 'ce_page',
        title: 'Paginated Responses',
        files: {
          'app/schemas/pagination.py': {
            language: 'python',
            code: `from typing import Generic, TypeVar\nfrom pydantic import BaseModel\n\nT = TypeVar('T')\n\nclass PageMeta(BaseModel):\n    total_items: int\n    total_pages: int\n    current_page: int\n\nclass PaginatedResponse(BaseModel, Generic[T]):\n    data: list[T]\n    meta: PageMeta\n    success: bool = True`
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch1',
        title: 'Implement the Pagination Model',
        description: 'Create an endpoint that returns a paginated list of users using the PaginatedResponse generic schema.',
        hint: 'Pass `PaginatedResponse[UserOut]` to the `response_model` argument of the router.',
        solution: 'Detailed solution explanation.',
        solutionCode: {
          id: 'sol1',
          language: 'python',
          title: 'Pagination Implementation',
          filename: 'users.py',
          code: `@router.get("/", response_model=PaginatedResponse[UserOut])\ndef get_users():\n    return PaginatedResponse(\n        data=[{"id": 1, "name": "Bob"}],\n        meta=PageMeta(total_items=1, total_pages=1, current_page=1)\n    )`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq1',
        question: 'Why avoid returning JSON Arrays at the top level of your API?',
        answer: 'Returning top-level arrays (e.g., `[{...}, {...}]`) makes it impossible to add metadata later (like pagination counts or correlation IDs) without breaking backward compatibility. Wrapping the array in an object (`{"data": [...]}`) provides extensibility.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn1',
        severity: 'info',
        content: 'While custom envelopes are great, consider adhering to established specifications like JSON:API or OData if you are building an API for a large ecosystem, as tooling already exists for them.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws1',
        scenario: 'The Pagination Rewrite',
        problem: 'An endpoint originally returned a flat list of 50 items. Over a year, the database grew to 50,000 items, and the endpoint started timing out. Adding pagination required changing the response schema, breaking all existing clients.',
        solution: 'If the endpoint had used an envelope structure from day one (`{"data": [], "meta": {}}`), pagination could have been added to the `meta` object and the data array simply capped at 50, requiring minimal client changes.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm1',
        title: 'Top Level Arrays',
        description: 'Returning an array directly as the JSON payload.',
        badCode: {
          id: 'bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `@router.get("/users")\ndef get_users() -> list[dict]:\n    return [{"id": 1}]`
        },
        goodCode: {
          id: 'good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `@router.get("/users")\ndef get_users() -> PaginatedResponse[UserOut]:\n    return PaginatedResponse(data=[{"id": 1}], meta=...)`
        }
      }
    ]
  }
};
