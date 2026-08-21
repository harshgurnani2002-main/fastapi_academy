import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch17Lessons: Record<string, Lesson> = {
  'testing-pyramid-strategy': {
    id: '17-01',
    slug: 'testing-pyramid-strategy',
    chapterId: 17,
    order: 1,
    title: 'Testing Pyramid & Strategy',
    description: 'Design a robust testing strategy for FastAPI applications.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.python],
    prerequisites: ['16-04'],
    objectives: [
      'Design the testing pyramid for FastAPI',
      'Balance unit, integration, and e2e tests',
      'Measure test coverage effectively',
      'Write tests that catch real bugs'
    ],
    sections: [
      {
        id: 'strategy',
        type: 'concept',
        title: 'The Modern API Testing Pyramid',
        content: `Traditional testing pyramids emphasize a large base of unit tests, fewer integration tests, and very few end-to-end (E2E) tests. However, in modern FastAPI development, this shape often morphs into a "Testing Honeycomb" or "Testing Diamond."

Why? Because much of the logic in a FastAPI app lies in the integration between components: dependency injection, database queries, Pydantic validation, and external API calls. Pure unit tests (testing functions in isolation with mocked dependencies) provide less value if the integration points fail.

Therefore, your strategy should prioritize fast, isolated integration tests (often using lightweight, containerized databases like Testcontainers) over purely mocked unit tests. Unit tests remain crucial for complex domain logic and algorithms, while E2E tests ensure the entire stack (including the web server, proxy, and database) functions correctly.`
      },
      {
        id: 'coverage',
        type: 'implementation',
        title: 'Meaningful Test Coverage',
        content: `Test coverage is a metric, not a goal. Achieving 100% test coverage does not mean your application is bug-free; it means every line of code was executed during a test. You should focus on *meaningful* assertions.

To measure coverage, use \`pytest-cov\`. Configure it in your \`pyproject.toml\` to ignore certain blocks of code that are practically impossible or unnecessary to test, such as type-checking blocks or simple configuration files.`,
        codeExample: {
          id: 'pyproject-toml',
          language: 'toml',
          title: 'Coverage Configuration',
          filename: 'pyproject.toml',
          code: `[tool.pytest.ini_options]
addopts = "--cov=app --cov-report=term-missing --cov-report=html"
testpaths = ["tests"]

[tool.coverage.run]
omit = [
    "app/main.py", # Usually minimal setup
    "app/config.py",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "if self.debug:",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "pass",
    "raise ImportError",
    "if TYPE_CHECKING:",
]`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-01',
        title: 'Define Testing Strategy',
        description: 'Configure pytest-cov for a new project to exclude type checking and __main__ blocks.',
        hint: 'Use the tool.coverage.report exclude_lines configuration.',
        solution: 'Add the configuration to pyproject.toml as shown in the section.',
        solutionCode: {
          id: 'sol-01',
          language: 'toml',
          title: 'Solution',
          filename: 'pyproject.toml',
          code: `[tool.coverage.report]\nexclude_lines = [\n    "if TYPE_CHECKING:",\n    "if __name__ == .__main__.:"\n]`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-01',
        question: 'Why might a testing "diamond" be preferred over a traditional pyramid for API development?',
        answer: 'API logic heavily relies on integrations (DBs, validation frameworks like Pydantic). Focusing on integration tests (the middle of the pyramid) catches more realistic bugs than isolated unit tests with heavy mocking.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-01',
        severity: 'warning',
        content: 'Do not chase 100% coverage at the expense of meaningful assertions. A test that runs code without verifying the outcome is worthless.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'pytest-async-testing': {
    id: '17-02',
    slug: 'pytest-async-testing',
    chapterId: 17,
    order: 2,
    title: 'pytest Async Testing Setup',
    description: 'Configure and write robust asynchronous tests for FastAPI.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.fastapi, technologies.python],
    prerequisites: ['17-01'],
    objectives: [
      'Configure pytest-asyncio correctly',
      'Write async test fixtures',
      'Use httpx AsyncClient for API tests',
      'Handle event loop issues in tests'
    ],
    sections: [
      {
        id: 'async-setup',
        type: 'concept',
        title: 'Understanding pytest-asyncio',
        content: `FastAPI is fundamentally asynchronous. To test async endpoints, your testing framework must be able to run async code. \`pytest-asyncio\` is the standard tool for this.

A common pitfall is event loop management. By default, \`pytest-asyncio\` might create a new event loop for each test or fixture, which can lead to "Task attached to a different loop" errors, especially when dealing with databases or shared resources. 

The best practice is to configure a single event loop scoped to the session or to carefully manage test scopes using the \`asyncio_mode = "auto"\` setting.`
      },
      {
        id: 'async-client',
        type: 'implementation',
        title: 'Using httpx.AsyncClient',
        content: `While FastAPI provides a \`TestClient\` (based on \`requests\`), it runs synchronously. For thorough testing of async endpoints, especially when testing concurrency or when your app relies on background tasks, using \`httpx.AsyncClient\` is recommended.

You can create an async fixture that yields the \`AsyncClient\`, passing your FastAPI app instance to it.`,
        codeExample: {
          id: 'async-client-fixture',
          title: 'Async Client Setup',
          files: {
            'conftest.py': {
              language: 'python',
              code: `import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from app.main import app

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client`
            },
            'test_users.py': {
              language: 'python',
              code: `import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_create_user(async_client: AsyncClient):
    response = await async_client.post("/users/", json={"email": "test@example.com", "password": "secure"})
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-02',
        title: 'Async Test Fixture',
        description: 'Create an async fixture that sets up a temporary resource and tears it down.',
        hint: 'Use the `async def` and `yield` keywords.',
        solution: 'Define the fixture with async context managers or explicit setup/teardown code around the yield.',
        solutionCode: {
          id: 'sol-02',
          language: 'python',
          title: 'Solution',
          filename: 'conftest.py',
          code: `@pytest.fixture\nasync def temp_resource():\n    resource = await create_resource()\n    yield resource\n    await resource.cleanup()`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-02',
        question: 'Why use httpx.AsyncClient instead of FastAPI\'s TestClient for testing an async API?',
        answer: 'TestClient uses synchronous requests under the hood (via Starlette). AsyncClient allows for testing truly asynchronous behavior, background tasks, and concurrency accurately without event loop blocking issues.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-02',
        severity: 'info',
        content: 'Use pytest-asyncio strict mode or anyio to ensure you are explicitly marking async tests, avoiding false positives where a coroutine is returned but never awaited.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'factory-patterns-fixtures': {
    id: '17-03',
    slug: 'factory-patterns-fixtures',
    chapterId: 17,
    order: 3,
    title: 'Factory Patterns & Test Fixtures',
    description: 'Use factory_boy and fixtures to generate realistic, isolated test data.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.python],
    prerequisites: ['17-02'],
    objectives: [
      'Build model factories with factory_boy',
      'Create reusable pytest fixtures',
      'Implement database transaction rollback in tests',
      'Generate realistic test data'
    ],
    sections: [
      {
        id: 'factories',
        type: 'concept',
        title: 'The Need for Factories',
        content: `As your domain model grows, manually creating test data (e.g., \`User(name="test", email="...", ...)\`) becomes verbose and brittle. If a new required field is added, dozens of tests break.

\`factory_boy\` solves this by allowing you to define default templates for your models. You can generate randomized, realistic data (often combined with \`Faker\`) and only override the specific fields relevant to the test at hand. This keeps tests focused and resilient to schema changes.`
      },
      {
        id: 'factory-impl',
        type: 'implementation',
        title: 'Implementing Async Factories',
        content: `Integrating \`factory_boy\` with SQLAlchemy 2.0 and async execution requires a bit of setup. You need to configure the factory to use an async session for creating records in the database.`,
        codeExample: {
          id: 'factory-boy-async',
          title: 'Async Factory Setup',
          files: {
            'factories.py': {
              language: 'python',
              code: `import factory
from app.models import User
from app.database import get_db

class AsyncSQLAlchemyModelFactory(factory.alchemy.SQLAlchemyModelFactory):
    @classmethod
    async def _create(cls, model_class, *args, **kwargs):
        # We need access to the session here. 
        # A common pattern is to inject it via fixture or class attribute.
        session = cls._meta.sqlalchemy_session
        obj = model_class(*args, **kwargs)
        session.add(obj)
        await session.flush()
        return obj

class UserFactory(AsyncSQLAlchemyModelFactory):
    class Meta:
        model = User
        # Session will be set dynamically in conftest
        sqlalchemy_session = None

    id = factory.Sequence(lambda n: n)
    email = factory.Faker('email')
    is_active = True`
            },
            'conftest.py': {
              language: 'python',
              code: `import pytest
from tests.factories import UserFactory

@pytest.fixture(autouse=True)
def setup_factories(db_session):
    """Inject the current test session into factories."""
    UserFactory._meta.sqlalchemy_session = db_session`
            },
            'test_logic.py': {
              language: 'python',
              code: `@pytest.mark.asyncio
async def test_active_user_logic():
    # Only override what matters for this test
    user = await UserFactory(is_active=False)
    assert user.is_active is False
    assert user.email is not None  # Faker generated this`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-03',
        title: 'Create a Post Factory',
        description: 'Create a factory for a Post model that has a foreign key to a User.',
        hint: 'Use factory.SubFactory to automatically generate relationships.',
        solution: 'Define PostFactory and use SubFactory(UserFactory) for the user relationship.',
        solutionCode: {
          id: 'sol-03',
          language: 'python',
          title: 'Solution',
          filename: 'factories.py',
          code: `class PostFactory(AsyncSQLAlchemyModelFactory):\n    class Meta:\n        model = Post\n    title = factory.Faker('sentence')\n    author = factory.SubFactory(UserFactory)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-03',
        question: 'How do factories improve test maintainability over manual data creation?',
        answer: 'Factories provide default values and abstract data creation. When a schema changes (e.g., a new required field), you only update the factory once, rather than updating hundreds of manual object instantiations across your test suite.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-03',
        severity: 'critical',
        content: 'Always rollback transactions after each test when using databases. Never commit test data. If your code uses explicit commits, use nested transactions (savepoints) to ensure rollback.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'testcontainers': {
    id: '17-04',
    slug: 'testcontainers',
    chapterId: 17,
    order: 4,
    title: 'Integration Testing with Testcontainers',
    description: 'Use Testcontainers to spin up real databases and services for tests.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.postgresql, technologies.redis],
    prerequisites: ['17-03'],
    objectives: [
      'Use Testcontainers for real PostgreSQL in tests',
      'Use Testcontainers for real Redis in tests',
      'Configure test database migrations',
      'Run integration tests in CI with containers'
    ],
    sections: [
      {
        id: 'testcontainers-concept',
        type: 'concept',
        title: 'Why Testcontainers?',
        content: `Mocking databases or using SQLite for tests when production uses PostgreSQL is a dangerous anti-pattern. SQLite does not support all PostgreSQL features (like specific JSONB operators, arrays, or advanced locking).

\`testcontainers-python\` allows you to programmatically spin up Docker containers for your dependencies (PostgreSQL, Redis, Kafka) right from your pytest fixtures. The containers are isolated, guarantee a clean state, and exactly match your production environment.`
      },
      {
        id: 'testcontainers-impl',
        type: 'implementation',
        title: 'PostgreSQL Testcontainer Setup',
        content: `You can define a session-scoped fixture that starts PostgreSQL, runs Alembic migrations, and yields the connection string.`,
        codeExample: {
          id: 'testcontainers-postgres',
          title: 'PostgreSQL Container Setup',
          files: {
            'conftest.py': {
              language: 'python',
              code: `import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command

@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:15-alpine") as postgres:
        url = postgres.get_connection_url().replace("postgresql+psycopg2", "postgresql+asyncpg")
        
        # Run migrations sync using a sync engine before async tests start
        sync_url = postgres.get_connection_url()
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", sync_url)
        command.upgrade(alembic_cfg, "head")
        
        yield url

@pytest.fixture(scope="session")
async def engine(postgres_url):
    engine = create_async_engine(postgres_url, echo=False)
    yield engine
    await engine.dispose()

@pytest.fixture
async def db_session(engine):
    # Use nested transactions for test isolation
    async with engine.connect() as connection:
        transaction = await connection.begin()
        # Create savepoint
        nested = await connection.begin_nested()
        
        SessionLocal = sessionmaker(
            bind=connection, class_=AsyncSession, expire_on_commit=False
        )
        async with SessionLocal() as session:
            yield session
            
        # Rollback to savepoint
        await nested.rollback()
        await transaction.rollback()`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-04',
        title: 'Redis Testcontainer',
        description: 'Set up a Redis Testcontainer fixture that yields a redis client.',
        hint: 'Use `testcontainers.redis.RedisContainer`.',
        solution: 'Start the RedisContainer in a fixture, get the port, and initialize a Redis client.',
        solutionCode: {
          id: 'sol-04',
          language: 'python',
          title: 'Solution',
          filename: 'conftest.py',
          code: `from testcontainers.redis import RedisContainer\nimport redis.asyncio as redis\n\n@pytest.fixture(scope="session")\ndef redis_client():\n    with RedisContainer("redis:7-alpine") as redis_container:\n        client = redis.Redis(host=redis_container.get_container_host_ip(), port=redis_container.get_exposed_port(6379))\n        yield client`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-04',
        question: 'What is the primary advantage of Testcontainers over SQLite in-memory databases?',
        answer: 'Testcontainers run the exact same database engine as production, ensuring queries, dialets, and specific features behave identically. SQLite lacks many advanced features of databases like PostgreSQL, leading to false confidence.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-04',
        severity: 'info',
        content: 'Testcontainers can increase test suite startup time. Scope your container fixtures to "session" to spin them up only once per test run, and use transactions to isolate individual tests.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'api-functional-testing': {
    id: '17-05',
    slug: 'api-functional-testing',
    chapterId: 17,
    order: 5,
    title: 'API Functional Testing',
    description: 'Thoroughly test HTTP methods, status codes, and validation.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.pytest],
    prerequisites: ['17-02'],
    objectives: [
      'Test all HTTP methods and status codes',
      'Test authentication and authorization',
      'Test pagination and filtering',
      'Test error responses and validation'
    ],
    sections: [
      {
        id: 'functional-concept',
        type: 'concept',
        title: 'Behavior-Driven API Tests',
        content: `Functional tests verify that the API behaves correctly from the client's perspective. You should not be mocking the database here; you should be sending HTTP requests and asserting on HTTP responses, status codes, and JSON bodies.

A robust functional test suite checks not just the "happy path" (200 OK), but also validation errors (422 Unprocessable Entity), authentication failures (401 Unauthorized), authorization boundaries (403 Forbidden), and resource non-existence (404 Not Found).`
      },
      {
        id: 'functional-impl',
        type: 'implementation',
        title: 'Testing Validation and Auth',
        content: `When testing validation, verify the specific error messages returned by Pydantic to ensure the client receives helpful feedback.`,
        codeExample: {
          id: 'functional-tests',
          title: 'Functional Endpoint Tests',
          files: {
            'test_items.py': {
              language: 'python',
              code: `import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_item_unauthorized(async_client: AsyncClient):
    response = await async_client.post("/items/", json={"name": "Test"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_create_item_validation_error(authorized_client: AsyncClient):
    # Missing required 'name' field
    response = await authorized_client.post("/items/", json={"description": "Test"})
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(e["loc"] == ["body", "name"] and e["type"] == "missing" for e in errors)

@pytest.mark.asyncio
async def test_create_item_success(authorized_client: AsyncClient):
    payload = {"name": "Valid Item", "price": 9.99}
    response = await authorized_client.post("/items/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert "id" in data`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-05',
        title: 'Test Pagination',
        description: 'Write a test that asserts an endpoint returns paginated results correctly (limit and offset).',
        hint: 'Seed the database with multiple items, then make a request with `?limit=2&offset=1`.',
        solution: 'Seed data, request with query params, assert length of response list and specific items returned.',
        solutionCode: {
          id: 'sol-05',
          language: 'python',
          title: 'Solution',
          filename: 'test_pagination.py',
          code: `response = await client.get("/items/?limit=2&offset=1")\nassert response.status_code == 200\ndata = response.json()\nassert len(data) == 2`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-05',
        question: 'Why is it important to assert specific validation error details rather than just a 422 status code?',
        answer: 'Asserting specific error details (like the location of the error in the body and the error type) ensures that the API contract remains stable and clients receive the exact guidance they expect when they submit invalid data.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-05',
        severity: 'warning',
        content: 'Do not tightly couple functional tests to exact error string messages if they are subject to change. Assert on error types and locations instead.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'mocking-strategies': {
    id: '17-06',
    slug: 'mocking-strategies',
    chapterId: 17,
    order: 6,
    title: 'Mocking Strategies',
    description: 'Effectively mock external APIs and time-dependent logic.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.python],
    prerequisites: ['17-01'],
    objectives: [
      'Mock external APIs with respx',
      'Mock database with dependency overrides',
      'Use freezegun for time-dependent tests',
      'Know when NOT to mock'
    ],
    sections: [
      {
        id: 'mocking-concept',
        type: 'concept',
        title: 'Strategic Mocking',
        content: `While we emphasize real databases, you *must* mock external third-party APIs (like Stripe, SendGrid, or external microservices) to prevent flaky, slow, and expensive test suites. 

FastAPI provides dependency overrides (\`app.dependency_overrides\`) which is fantastic for swapping out internal service classes. For HTTP calls made *by* your app, libraries like \`respx\` (which mocks \`httpx\`) are cleaner than patching standard libraries.`
      },
      {
        id: 'mocking-impl',
        type: 'implementation',
        title: 'Mocking External APIs with RESPX',
        content: `If your FastAPI app uses \`httpx.AsyncClient\` internally to call a third-party API, \`respx\` allows you to intercept those calls and return deterministic responses.`,
        codeExample: {
          id: 'respx-mock',
          title: 'RESPX Mocking',
          files: {
            'test_external.py': {
              language: 'python',
              code: `import pytest
import respx
from httpx import Response
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
@respx.mock
async def test_payment_processing():
    # Intercept outbound calls to Stripe
    stripe_route = respx.post("https://api.stripe.com/v1/charges").mock(
        return_value=Response(200, json={"id": "ch_123", "status": "succeeded"})
    )
    
    # Hit our own FastAPI endpoint
    response = client.post("/checkout/", json={"amount": 1000})
    
    # Assert our API behaved correctly
    assert response.status_code == 200
    assert response.json()["payment_id"] == "ch_123"
    
    # Assert the external API was called as expected
    assert stripe_route.called
    assert stripe_route.call_count == 1`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-06',
        title: 'Time Travel Testing',
        description: 'Use the `freezegun` library to test a function that relies on `datetime.now()`.',
        hint: 'Use the `@freeze_time("2023-01-01")` decorator.',
        solution: 'Decorate the test function, execute logic, and assert time-dependent outcomes.',
        solutionCode: {
          id: 'sol-06',
          language: 'python',
          title: 'Solution',
          filename: 'test_time.py',
          code: `from freezegun import freeze_time\nimport datetime\n\n@freeze_time("2023-01-01")\ndef test_time_logic():\n    assert datetime.datetime.now() == datetime.datetime(2023, 1, 1)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-06',
        question: 'When should you use FastAPI dependency overrides versus library-level mocking (like respx)?',
        answer: 'Dependency overrides are ideal for swapping internal architectural components (e.g., swapping a production database session for a test one, or a real email service class for a dummy one). Library-level mocking (respx) is best for intercepting exact network calls at the edge of your application to verify HTTP interactions.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-06',
        severity: 'warning',
        content: 'Mocking too heavily leads to tests that verify your mocks, not your code. Only mock boundaries outside of your direct control (external APIs, time, randomness).'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'websocket-testing': {
    id: '17-07',
    slug: 'websocket-testing',
    chapterId: 17,
    order: 7,
    title: 'WebSocket Testing',
    description: 'Test WebSocket connections, broadcasts, and state in FastAPI.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.pytest, technologies.websockets],
    prerequisites: ['17-02'],
    objectives: [
      'Test WebSocket connection lifecycle',
      'Test broadcast to multiple clients',
      'Test authentication on WebSocket',
      'Test error handling and disconnection'
    ],
    sections: [
      {
        id: 'ws-concept',
        type: 'concept',
        title: 'WebSocket Testing Challenges',
        content: `Testing WebSockets is stateful. Unlike REST requests where a test sends a request and asserts a response, WebSocket tests must establish a connection, send frames, receive frames, and handle disconnections.

FastAPI's \`TestClient\` provides a \`websocket_connect\` context manager that makes testing sync and async WebSocket endpoints surprisingly straightforward.`
      },
      {
        id: 'ws-impl',
        type: 'implementation',
        title: 'Testing WebSocket Interactions',
        content: `Using the \`TestClient\`, you can simulate a client connecting to a chat room, sending a message, and receiving the echo.`,
        codeExample: {
          id: 'ws-test',
          title: 'WebSocket Testing',
          files: {
            'test_websockets.py': {
              language: 'python',
              code: `from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_websocket_chat():
    with client.websocket_connect("/ws/chat/room_1") as websocket:
        # Send a message
        websocket.send_json({"text": "Hello, World!"})
        
        # Receive the broadcasted message
        data = websocket.receive_json()
        assert data["text"] == "Hello, World!"
        assert data["room"] == "room_1"

def test_websocket_auth_failure():
    # Expect connection refusal (403) for invalid token
    try:
        with client.websocket_connect("/ws/secure?token=invalid"):
            pass
        assert False, "Should have raised exception"
    except Exception as e:
        # Specific exception handling depends on Starlette version
        pass`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-07',
        title: 'Multi-client Broadcast',
        description: 'Test that a message sent by client A is received by client B in the same room.',
        hint: 'Use two `websocket_connect` context managers simultaneously.',
        solution: 'Open two connections, send from one, receive from the other.',
        solutionCode: {
          id: 'sol-07',
          language: 'python',
          title: 'Solution',
          filename: 'test_ws.py',
          code: `with client.websocket_connect("/ws") as ws1, client.websocket_connect("/ws") as ws2:\n    ws1.send_text("Ping")\n    data = ws2.receive_text()\n    assert data == "Ping"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-07',
        question: 'How do you handle testing WebSocket connections that require authentication via headers, given standard browser WebSocket APIs do not support custom headers?',
        answer: 'Usually, WebSocket authentication is handled via query parameters or a first message payload. In tests, you pass these query parameters via the test client URL, or send the authentication JSON payload immediately after the connection opens, asserting the connection is closed if auth fails.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-07',
        severity: 'info',
        content: 'When testing long-running WebSocket connections, ensure you explicitly close them in the test or use the context manager properly to prevent hanging test suites.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'race-condition-testing': {
    id: '17-08',
    slug: 'race-condition-testing',
    chapterId: 17,
    order: 8,
    title: 'Race Condition Testing',
    description: 'Detect and prevent concurrency issues in API endpoints.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql, technologies.pytest],
    prerequisites: ['17-02'],
    objectives: [
      'Write concurrent test scenarios',
      'Use asyncio.gather for parallel requests',
      'Verify locking prevents race conditions',
      'Test idempotency under concurrent load'
    ],
    sections: [
      {
        id: 'race-concept',
        type: 'concept',
        title: 'The Concurrency Trap',
        content: `FastAPI handles many requests concurrently. If you have logic like "check if balance is > 0, then deduct," two simultaneous requests can pass the check before either deducts, leading to negative balances. 

Unit tests usually run sequentially and miss these bugs. You must explicitly write tests that fire concurrent requests to verify database locking (like \`SELECT FOR UPDATE\`) or idempotency keys work correctly.`
      },
      {
        id: 'race-impl',
        type: 'implementation',
        title: 'Testing with asyncio.gather',
        content: `You can use \`asyncio.gather\` to fire multiple requests at the exact same time and assert that database constraints or application locks hold up.`,
        codeExample: {
          id: 'race-condition',
          title: 'Concurrency Test',
          files: {
            'test_concurrency.py': {
              language: 'python',
              code: `import pytest
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_concurrent_withdrawals_prevent_overdraft(async_client: AsyncClient, setup_account):
    account_id = setup_account.id # Account has 100 balance
    
    # Fire 3 withdrawal requests of 50 concurrently
    async def make_withdrawal():
        return await async_client.post(
            f"/accounts/{account_id}/withdraw", json={"amount": 50}
        )

    tasks = [make_withdrawal() for _ in range(3)]
    responses = await asyncio.gather(*tasks)
    
    # Only two should succeed (2x50 = 100), one must fail
    successes = [r for r in responses if r.status_code == 200]
    failures = [r for r in responses if r.status_code == 400]
    
    assert len(successes) == 2
    assert len(failures) == 1
    
    # Verify final balance is 0
    final_state = await async_client.get(f"/accounts/{account_id}")
    assert final_state.json()["balance"] == 0`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-08',
        title: 'Test Idempotency',
        description: 'Test that sending three identical creation requests concurrently only creates one resource.',
        hint: 'Use a unique idempotency key in the payload.',
        solution: 'Fire concurrent requests using asyncio.gather with the same idempotency key, assert only one 201 Created is returned, and others are 200 OK or 409 Conflict.',
        solutionCode: {
          id: 'sol-08',
          language: 'python',
          title: 'Solution',
          filename: 'test_idempotency.py',
          code: `tasks = [client.post("/resource", json={"idempotency_key": "123"}) for _ in range(3)]\nresps = await asyncio.gather(*tasks)\nassert len([r for r in resps if r.status_code == 201]) == 1`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-08',
        question: 'How do you prevent the race condition tested in this lesson at the database level?',
        answer: 'Use explicit row-level locking. In SQLAlchemy, this is done using `.with_for_update()` on the query before modifying the record. This forces concurrent transactions to wait until the first transaction releases the lock.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-08',
        severity: 'critical',
        content: 'Race condition tests can be flaky in CI due to varying execution speeds. Ensure your assertions are robust and handle timing variations.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'property-based-testing': {
    id: '17-09',
    slug: 'property-based-testing',
    chapterId: 17,
    order: 9,
    title: 'Property-Based Testing with Hypothesis',
    description: 'Use Hypothesis to generate massive amounts of edge-case data automatically.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.python],
    prerequisites: ['17-01'],
    objectives: [
      'Write Hypothesis strategies for Pydantic models',
      'Test API endpoints with random valid input',
      'Find edge cases humans would miss',
      'Configure Hypothesis settings for CI'
    ],
    sections: [
      {
        id: 'hypothesis-concept',
        type: 'concept',
        title: 'Beyond Example-Based Testing',
        content: `Standard testing is "example-based": you provide specific inputs (e.g., \`test_calculate_tax(100) -> 105\`). 

Property-based testing, via libraries like \`Hypothesis\`, allows you to define *properties* your code should uphold for *any* valid input. Hypothesis will automatically generate thousands of inputs (integers, strings with weird unicode, floats) trying to find an input that breaks your assertions. When it finds one, it "shrinks" it to the simplest possible failing example.`
      },
      {
        id: 'hypothesis-impl',
        type: 'implementation',
        title: 'Integrating Hypothesis with Pydantic',
        content: `You can use Hypothesis to generate valid payloads based on your Pydantic schemas, and fire them against your FastAPI app to ensure it doesn't crash on edge cases.`,
        codeExample: {
          id: 'hypothesis-test',
          title: 'Hypothesis API Testing',
          files: {
            'test_properties.py': {
              language: 'python',
              code: `from hypothesis import given, settings, strategies as st
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@settings(max_examples=100)
@given(
    username=st.text(min_size=1, max_size=50),
    age=st.integers(min_value=18, max_value=120)
)
def test_create_user_never_500s(username, age):
    # Hypothesis will feed weird unicode strings and edge-case ints
    payload = {"username": username, "age": age}
    response = client.post("/users/", json=payload)
    
    # We don't care if it's 201 or 422, we just care it doesn't crash (500)
    assert response.status_code < 500`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-09',
        title: 'Generate Pydantic Models',
        description: 'Use the `hypothesis-jsonschema` library or manual strategies to generate a full Pydantic model payload.',
        hint: 'Hypothesis can build strategies directly from classes or schemas.',
        solution: 'Use `st.builds(Model)` to auto-generate data for the Pydantic model.',
        solutionCode: {
          id: 'sol-09',
          language: 'python',
          title: 'Solution',
          filename: 'test_pydantic.py',
          code: `@given(user_data=st.builds(UserCreateSchema))\ndef test_endpoint(user_data):\n    client.post("/users", json=user_data.model_dump())`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-09',
        question: 'What is the "shrinking" phase in property-based testing?',
        answer: 'When Hypothesis finds an input that fails a test (like a massive 500-character string), it attempts to iteratively simplify the input (shrinking it down to a 1-character string) to find the absolute minimum input required to trigger the bug, making debugging much easier.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-09',
        severity: 'info',
        content: 'Property-based tests can be slow. Use `@settings` profiles to run fewer examples locally and max out examples during nightly CI runs.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'contract-testing': {
    id: '17-10',
    slug: 'contract-testing',
    chapterId: 17,
    order: 10,
    title: 'Contract Testing',
    description: 'Ensure your API complies with its OpenAPI schema using Schemathesis.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.pytest, technologies.fastapi],
    prerequisites: ['17-09'],
    objectives: [
      'Write consumer-driven contracts',
      'Use schemathesis for API contract testing',
      'Verify OpenAPI schema compliance',
      'Integrate contract tests in CI'
    ],
    sections: [
      {
        id: 'contract-concept',
        type: 'concept',
        title: 'What is Contract Testing?',
        content: `Your OpenAPI schema is a contract between your backend and frontend (or other services). If your code returns an integer when the schema promises a string, you break the contract, causing client crashes.

Contract testing tools like \`schemathesis\` automatically read your FastAPI OpenAPI schema and generate tests to verify that every endpoint adheres exactly to the documented inputs, outputs, and status codes.`
      },
      {
        id: 'contract-impl',
        type: 'implementation',
        title: 'Automated Testing with Schemathesis',
        content: `Schemathesis integrates seamlessly with pytest and FastAPI to automatically validate your app against its own generated schema.`,
        codeExample: {
          id: 'schemathesis-test',
          title: 'Schemathesis Setup',
          files: {
            'test_contract.py': {
              language: 'python',
              code: `import schemathesis
from app.main import app

# Load schema directly from the FastAPI app instance
schema = schemathesis.from_asgi("/openapi.json", app)

# Automatically test all operations defined in the OpenAPI schema
@schema.parametrize()
def test_api(case):
    # Sends a generated request to the app
    response = case.call_asgi()
    
    # Verifies the response matches the schema definition
    # e.g., correct status code, correct data types in JSON body
    case.validate_response(response)`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-10',
        title: 'Add Schemathesis Hooks',
        description: 'Configure Schemathesis to include an authorization header for protected endpoints.',
        hint: 'Use the before_generate or modify headers directly in the call.',
        solution: 'Pass headers in case.call_asgi() to inject auth.',
        solutionCode: {
          id: 'sol-10',
          language: 'python',
          title: 'Solution',
          filename: 'test_contract.py',
          code: `@schema.parametrize()\ndef test_api(case):\n    response = case.call_asgi(headers={"Authorization": "Bearer token"})\n    case.validate_response(response)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-10',
        question: 'Why is contract testing particularly powerful for microservice architectures?',
        answer: 'In microservices, services deploy independently. Consumer-driven contract testing ensures that Service A does not deploy a change that breaks the expected input/output contract relied upon by Service B.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10',
        severity: 'warning',
        content: 'Schemathesis can generate heavy load and manipulate database states. Run it against a dedicated test database, never production.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'performance-testing': {
    id: '17-11',
    slug: 'performance-testing',
    chapterId: 17,
    order: 11,
    title: 'Performance Testing in CI',
    description: 'Catch performance regressions automatically in your test suite.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.pytest],
    prerequisites: ['17-05'],
    objectives: [
      'Add performance assertions to tests',
      'Benchmark critical endpoints',
      'Detect performance regressions in CI',
      'Use pytest-benchmark for measurements'
    ],
    sections: [
      {
        id: 'perf-concept',
        type: 'concept',
        title: 'Shift-Left Performance Testing',
        content: `Load testing (using tools like Locust or k6) usually happens late in the deployment cycle. However, you can catch glaring performance regressions early (shift-left) by integrating micro-benchmarks directly into pytest.

Using \`pytest-benchmark\`, you can measure the execution time of critical functions (like complex database queries or serialization) and fail the CI build if the time exceeds a certain threshold.`
      },
      {
        id: 'perf-impl',
        type: 'implementation',
        title: 'Using pytest-benchmark',
        content: `You can inject the \`benchmark\` fixture to measure synchronous or asynchronous code execution.`,
        codeExample: {
          id: 'pytest-benchmark',
          title: 'Benchmarking Functions',
          files: {
            'test_performance.py': {
              language: 'python',
              code: `import pytest
from app.services import calculate_heavy_report

def test_report_generation_performance(benchmark):
    # benchmark will execute the function multiple times and gather stats
    result = benchmark(calculate_heavy_report, data_size=1000)
    
    assert result is not None
    
    # Access benchmark stats
    assert benchmark.stats.stats.mean < 0.5  # Mean execution time under 500ms`
            },
            'test_async_perf.py': {
              language: 'python',
              code: `import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_endpoint_perf(benchmark, async_client: AsyncClient):
    async def make_request():
        return await async_client.get("/heavy-endpoint")
        
    # For async code, you need a custom run function or pytest-benchmark async plugins
    # Alternatively, time it manually if basic assertions are enough
    import time
    start = time.perf_counter()
    await make_request()
    duration = time.perf_counter() - start
    
    assert duration < 1.0  # Must resolve in under 1 second`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-11',
        title: 'Manual Timing Context Manager',
        description: 'Create a custom context manager `assert_max_time(seconds)` that raises an assertion error if the block takes too long.',
        hint: 'Use `time.perf_counter()` in `__enter__` and `__exit__`.',
        solution: 'Implement the context manager and check time elapsed.',
        solutionCode: {
          id: 'sol-11',
          language: 'python',
          title: 'Solution',
          filename: 'utils.py',
          code: `import time\nfrom contextlib import contextmanager\n\n@contextmanager\ndef assert_max_time(seconds):\n    start = time.perf_counter()\n    yield\n    if time.perf_counter() - start > seconds:\n        raise AssertionError(f"Took too long")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-11',
        question: 'Why are micro-benchmarks in CI sometimes unreliable, and how do you mitigate this?',
        answer: 'CI environments have fluctuating resources ("noisy neighbors"). To mitigate flaky performance tests, use generous thresholds (e.g., catching catastrophic regressions where a 10ms query becomes a 5000ms query due to a missing index) rather than strict microsecond checks.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-11',
        severity: 'warning',
        content: 'Do not use micro-benchmarks as a replacement for full-system load testing. CI benchmarks catch obvious algorithmic regressions; load testing catches infrastructure and concurrency bottlenecks.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'test-organization': {
    id: '17-12',
    slug: 'test-organization',
    chapterId: 17,
    order: 12,
    title: 'Test Organization & CI Integration',
    description: 'Organize tests for speed, maintainability, and seamless CI integration.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.pytest, technologies.github_actions],
    prerequisites: ['17-01'],
    objectives: [
      'Organize tests by type (unit/integration/e2e)',
      'Configure parallel test execution',
      'Generate test reports and coverage',
      'Optimize CI test pipeline speed'
    ],
    sections: [
      {
        id: 'org-concept',
        type: 'concept',
        title: 'Directory Structure and Markers',
        content: `As your test suite grows, running all tests takes too long. You should organize tests structurally (directories) and logically (pytest markers).

Separate \`tests/unit\`, \`tests/integration\`, and \`tests/e2e\`. Use custom markers (e.g., \`@pytest.mark.slow\`) so developers can easily run only fast unit tests locally, while CI runs the full suite.`
      },
      {
        id: 'org-impl',
        type: 'implementation',
        title: 'pytest Configuration and CI setup',
        content: `Configure \`pytest.ini\` to register markers and use \`pytest-xdist\` to run tests in parallel across multiple CPU cores.`,
        codeExample: {
          id: 'ci-setup',
          title: 'Organization and CI',
          files: {
            'pytest.ini': {
              language: 'ini',
              code: `[pytest]
asyncio_mode = auto
markers =
    unit: isolated tests with mocked dependencies
    integration: tests that hit real database
    e2e: full end-to-end flow tests
    slow: tests that take longer than 1 second`
            },
            '.github/workflows/test.yml': {
              language: 'yaml',
              code: `name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: pass
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run Pytest in parallel
        # -n auto tells pytest-xdist to use all CPU cores
        run: pytest -n auto -m "not e2e" --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-12',
        title: 'Run Specific Markers',
        description: 'Provide the pytest command to run tests that are marked as `integration` but NOT marked as `slow`.',
        hint: 'Use the -m flag with boolean logic.',
        solution: 'Use pytest -m "integration and not slow"',
        solutionCode: {
          id: 'sol-12',
          language: 'bash',
          title: 'Solution',
          filename: 'terminal',
          code: `pytest -m "integration and not slow"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-12',
        question: 'How does pytest-xdist improve test execution time, and what is the main caveat?',
        answer: 'pytest-xdist runs tests in parallel across multiple CPU workers. The main caveat is that tests must be completely isolated; if tests share state (like modifying the same database rows without rollbacks), parallel execution will cause random test failures due to race conditions.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-12',
        severity: 'info',
        content: 'If database setup takes too long in CI, consider baking a custom Docker image containing the database with pre-applied schemas and static seed data to speed up container startup.'
      }
    ],
    codeExamples: [],
    realWorldScenarios: [],
    commonMistakes: [],
  }
};
