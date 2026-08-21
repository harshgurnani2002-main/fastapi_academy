import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch16Lessons: Record<string, Lesson> = {
  'observability-pillars': {
    id: '16-01',
    slug: 'observability-pillars',
    chapterId: 16,
    order: 1,
    title: 'The Three Pillars: Logs, Metrics, Traces',
    description: 'Understand the core concepts of observability in modern distributed systems.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.prometheus],
    prerequisites: ['15-10'],
    objectives: [
      'Understand the differences between logging, metrics, and tracing.',
      'Learn how the three pillars interoperate to provide full system visibility.',
      'Design an observability strategy for a FastAPI application.',
    ],
    sections: [
      {
        id: '16-01-sec1',
        type: 'concept',
        title: 'Defining the Three Pillars',
        content: `Observability in distributed systems relies on three distinct but complementary pillars: logs, metrics, and traces. 

**Logs** are immutable records of discrete events that happened over time. They are invaluable for debugging specific errors (e.g., an exception traceback). 

**Metrics** are numerical measurements of system state over intervals of time. They are highly compressible and cheap to store, making them ideal for dashboards, alerts, and capacity planning (e.g., CPU usage, request rate). 

**Traces** track the progression of a single request across system boundaries. They are essential for understanding bottlenecks in microservices architectures. Together, these three pillars form a triad that allows you to detect issues (metrics), pinpoint where they happened (traces), and understand why they happened (logs).`,
      },
      {
        id: '16-01-sec2',
        type: 'architecture',
        title: 'Observability Architecture in FastAPI',
        content: `In a production FastAPI deployment, your application needs instrumentation to emit signals for all three pillars. 
        
For logs, we use structured JSON logging to allow log aggregators (like ELK or Loki) to query specific fields. 
For metrics, we use Prometheus middleware to scrape request latencies and counts. 
For tracing, we use OpenTelemetry auto-instrumentation to attach context to external calls like database queries or HTTP requests. 
All of these signals should share a common identifier (the trace ID) so that when an alert fires, you can seamlessly pivot from a metric spike to the exact traces involved, and finally to the specific error logs.`,
      },
      {
        id: '16-01-sec3',
        type: 'implementation',
        title: 'Basic Telemetry Setup',
        content: `Before diving deep into each pillar, let's look at how we conceptually wire up basic telemetry in FastAPI.`,
        codeExample: {
          id: '16-01-code1',
          language: 'python',
          title: 'Bootstrapping Telemetry',
          filename: 'app/telemetry.py',
          code: `import logging
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

def setup_telemetry(app: FastAPI):
    # 1. Logging (Basic setup)
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("api")
    logger.info("Telemetry initialization started")
    
    # 2. Metrics (Prometheus)
    Instrumentator().instrument(app).expose(app)
    
    # 3. Tracing (OpenTelemetry)
    FastAPIInstrumentor.instrument_app(app)
    
    logger.info("Telemetry initialization complete")
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-01-chal',
        title: 'Identify the Signal',
        description: 'Given a scenario where API latency suddenly spikes, explain which pillar you would consult first, second, and third.',
        hint: 'Think about how you detect an issue vs how you debug an issue.',
        solution: 'First: Metrics (dashboards/alerts notify you of the latency spike). Second: Traces (to identify WHICH service or database query is slow). Third: Logs (to see IF that specific slow query resulted in an error or retry loop).',
        solutionCode: {
          id: '16-01-chal-sol',
          language: 'python',
          title: 'No code needed',
          filename: 'concept.txt',
          code: 'Conceptual challenge'
        }
      }
    ],
    interviewQuestions: [
      {
        id: '16-01-int1',
        question: 'Why not just use logs for everything, including calculating latency metrics?',
        answer: 'Logs are high-cardinality and expensive to process. Calculating percentiles (like p99 latency) over millions of log lines is computationally intensive and slow. Metrics are pre-aggregated and cheap to query, making them the right choice for time-series analysis and alerting.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '16-01-pn1',
        severity: 'info',
        content: 'Aim for "single pane of glass" observability where logs, metrics, and traces are accessible from the same UI platform (e.g., Grafana, Datadog) to reduce context switching during outages.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'structured-logging': {
    id: '16-02',
    slug: 'structured-logging',
    chapterId: 16,
    order: 2,
    title: 'Structured Logging with JSON',
    description: 'Implement structured logging using structlog to make logs easily queryable by aggregators.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['16-01'],
    objectives: [
      'Replace standard Python logging with structured JSON logging.',
      'Configure structlog for high performance.',
      'Bind contextual data (like user_id) to logs globally within a request.',
    ],
    sections: [
      {
        id: '16-02-sec1',
        type: 'concept',
        title: 'Why Structured Logging?',
        content: `Traditional logging outputs unstructured text (e.g., \`INFO: 2023-10-01 User 123 failed to login\`). While readable by humans, querying this log in a centralized system requires complex regex parsing. 

Structured logging outputs machine-readable data, typically JSON. The equivalent structured log would be \`{"level": "info", "timestamp": "2023-10-01T...", "event": "failed to login", "user_id": 123}\`. 
This allows you to instantly query for all logs where \`user_id == 123\` or filter by \`level\`. In Python, the \`structlog\` library is the standard for implementing this efficiently, supporting contextual binding where you can attach variables (like request IDs) to all logs emitted within a specific context.`,
      },
      {
        id: '16-02-sec2',
        type: 'implementation',
        title: 'Configuring Structlog',
        content: `Setting up structlog involves defining processors. Processors act as a pipeline, enriching the log dictionary before it is ultimately rendered as JSON.`,
        codeExample: {
          id: '16-02-code1',
          language: 'python',
          title: 'Structlog Setup',
          filename: 'app/logger.py',
          code: `import logging
import structlog
import sys

def setup_logging():
    # Route standard logging to structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars, # Support for ContextVars
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(), # Render as JSON
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger()

logger = setup_logging()
`
        }
      },
      {
        id: '16-02-sec3',
        type: 'implementation',
        title: 'Contextual Binding in FastAPI',
        content: `One of the most powerful features of structlog is context variables. We can use a FastAPI dependency or middleware to bind data (like the client IP or request ID) so that every log emitted during that request automatically includes this data.`,
        codeExample: {
          id: '16-02-code2',
          language: 'python',
          title: 'Context Binding',
          filename: 'app/middleware.py',
          code: `import structlog
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class StructlogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Bind data globally for this async context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            client_ip=request.client.host if request.client else None
        )
        
        response = await call_next(request)
        
        # Log request completion
        logger = structlog.get_logger("api.access")
        logger.info(
            "Request completed", 
            status_code=response.status_code
        )
        
        response.headers["X-Request-ID"] = request_id
        return response
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-02-chal',
        title: 'Bind User ID',
        description: 'Update the context variables to also include the `user_id` if the user is authenticated.',
        hint: 'You might need to do this binding in a dependency after authentication, rather than in the middleware which runs before auth.',
        solution: 'In your `get_current_user` dependency, after verifying the token, call `structlog.contextvars.bind_contextvars(user_id=user.id)`. Any logs deeper in the call stack will now include it.',
        solutionCode: {
          id: '16-02-chal-sol',
          language: 'python',
          title: 'Auth Dependency Binding',
          filename: 'app/deps.py',
          code: `import structlog
from fastapi import Depends

def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    # Bind the user ID dynamically during the request lifecycle
    structlog.contextvars.bind_contextvars(user_id=user.id)
    return user
`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '16-02-int1',
        question: 'How do ContextVars solve the problem of contextual logging in async applications?',
        answer: 'In threaded sync apps, thread-local storage is used. But in async apps (like FastAPI), multiple requests run concurrently on the same thread using the event loop. Python\'s `contextvars` module provides state that is local to an asyncio task, allowing structlog to safely store request-specific context without it leaking into concurrent requests on the same thread.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '16-02-pn1',
        severity: 'warning',
        content: 'Never log PII (Personally Identifiable Information) or secrets (tokens, passwords). Configure structlog processors to sanitize or mask sensitive fields automatically.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [
      {
        id: '16-02-cm1',
        title: 'String Formatting in Logs',
        description: 'Using f-strings inside the log message defeats the purpose of structured logging, as the dynamic data is buried in the string.',
        badCode: {
          id: '16-02-cm1-bad',
          language: 'python',
          title: 'Unstructured F-String',
          code: `logger.info(f"User {user_id} purchased item {item_id}")`
        },
        goodCode: {
          id: '16-02-cm1-good',
          language: 'python',
          title: 'Structured Key-Value',
          code: `logger.info("item_purchased", user_id=user_id, item_id=item_id)`
        }
      }
    ]
  },
  'correlation-ids': {
    id: '16-03',
    slug: 'correlation-ids',
    chapterId: 16,
    order: 3,
    title: 'Correlation IDs & Request Tracing',
    description: 'Implement distributed correlation IDs to track requests across microservices.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['16-02'],
    objectives: [
      'Understand the role of correlation IDs in microservice architectures.',
      'Propagate correlation IDs through HTTP headers.',
      'Inject correlation IDs into downstream API calls (e.g., using httpx).',
    ],
    sections: [
      {
        id: '16-03-sec1',
        type: 'concept',
        title: 'The Need for Correlation',
        content: `In a microservices architecture, a single user action might trigger requests across three different services. If an error occurs in the third service, how do you find the related logs in the first two services? 

A Correlation ID (or Request ID) solves this. It is a unique identifier generated at the entry point of the architecture (usually the API Gateway). This ID is passed to downstream services via HTTP headers (commonly \`X-Correlation-ID\` or \`X-Request-ID\`). Every service extracts this ID and includes it in all its log entries. When debugging, you simply search your log aggregator for that ID to see the full narrative of the transaction across all services.`,
      },
      {
        id: '16-03-sec2',
        type: 'implementation',
        title: 'Extracting and Propagating IDs',
        content: `To implement this, we need to extract the ID from incoming headers (or generate one if missing), bind it to our structured logs, and importantly, ensure any outgoing HTTP requests (via httpx) include it.`,
        codeExample: {
          id: '16-03-code1',
          language: 'python',
          title: 'Correlation Middleware and Client',
          filename: 'app/correlation.py',
          code: `import uuid
import structlog
import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from contextvars import ContextVar

# ContextVar to hold the correlation ID for the current async task
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract from header or generate new
        cid = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        
        # Set the context variable
        token = correlation_id.set(cid)
        
        # Bind to structlog
        structlog.contextvars.bind_contextvars(correlation_id=cid)
        
        try:
            response = await call_next(request)
            response.headers["X-Correlation-ID"] = cid
            return response
        finally:
            # Reset context
            correlation_id.reset(token)

# A custom httpx client that automatically injects the header
def get_http_client() -> httpx.AsyncClient:
    cid = correlation_id.get()
    headers = {"X-Correlation-ID": cid} if cid else {}
    return httpx.AsyncClient(headers=headers)
`
        }
      },
      {
        id: '16-03-sec3',
        type: 'realworld',
        title: 'Beyond HTTP: Async Tasks',
        content: `Correlation must cross not just HTTP boundaries, but also asynchronous boundaries like message queues. If your FastAPI app enqueues a Celery task, the correlation ID MUST be passed as a task parameter or header so the worker can extract it and continue the logging context. OpenTelemetry simplifies much of this context propagation automatically, but understanding the manual mechanism is crucial.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-03-chal',
        title: 'Trace a Database Query',
        description: 'How would you ensure that slow database queries logged by SQLAlchemy include the current correlation ID?',
        hint: 'Structlog is already configured with ContextVars.',
        solution: 'If SQLAlchemy is configured to use standard python logging, and you routed standard logging to structlog, the context variables (including `correlation_id`) bound in the middleware will automatically be attached to SQLAlchemy logs emitted during that request.',
        solutionCode: {
          id: '16-03-chal-sol',
          language: 'python',
          title: 'SQLAlchemy Logging',
          filename: 'app/db.py',
          code: `# Enable SQLAlchemy engine logging
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
# Because standard logging routes to structlog, correlation_id is appended automatically!`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-03-pn1',
        severity: 'critical',
        content: 'When trusting `X-Correlation-ID` from external requests, be aware of spoofing. In production, edge gateways (like NGINX or Cloudflare) should overwrite this header unless the request originates from an internal trusted network.'
      }
    ],
    realWorldScenarios: [
      {
        id: '16-03-rws1',
        scenario: 'The Silent Retry',
        problem: 'A payment service was processing duplicate payments, but the API logs showed only one request per user.',
        solution: 'The internal microservice was encountering a timeout and retrying. By tracing the correlation ID across all services, the team saw ONE gateway request resulted in THREE identical requests to the payment processor. The solution was implementing idempotency keys alongside correlation IDs.'
      }
    ],
    commonMistakes: []
  },
  'prometheus-metrics': {
    id: '16-04',
    slug: 'prometheus-metrics',
    chapterId: 16,
    order: 4,
    title: 'Prometheus Metrics in FastAPI',
    description: 'Expose standard and custom Prometheus metrics from your FastAPI application.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.prometheus],
    prerequisites: ['16-03'],
    objectives: [
      'Understand the Prometheus pull model and metric types.',
      'Instrument a FastAPI app using prometheus-fastapi-instrumentator.',
      'Create and record custom business metrics.',
    ],
    sections: [
      {
        id: '16-04-sec1',
        type: 'concept',
        title: 'The Prometheus Model',
        content: `Prometheus operates on a pull model: your application exposes a \`/metrics\` HTTP endpoint that outputs plain-text time-series data, and a Prometheus server periodically "scrapes" (requests) this endpoint. 

There are four main metric types:
1. **Counter**: Only goes up (e.g., total requests, errors).
2. **Gauge**: Can go up and down (e.g., current active users, memory usage, queue length).
3. **Histogram**: Samples observations and counts them into configurable buckets (e.g., request latency, payload size). Used to calculate percentiles (p95, p99).
4. **Summary**: Similar to Histogram but calculates percentiles client-side (rarely used due to aggregation issues).`,
      },
      {
        id: '16-04-sec2',
        type: 'implementation',
        title: 'Standard HTTP Instrumentation',
        content: `The \`prometheus-fastapi-instrumentator\` library automatically provides standard HTTP metrics: request counts, latencies, and response sizes, labeled by HTTP method, status code, and endpoint path.`,
        codeExample: {
          id: '16-04-code1',
          language: 'python',
          title: 'Instrumentator Setup',
          filename: 'app/main.py',
          code: `from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Setup instrumentator
instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=[".*admin.*", "/metrics"]
)

# Instrument the app and expose the /metrics endpoint
instrumentator.instrument(app).expose(app, endpoint="/metrics")

@app.get("/")
def read_root():
    return {"message": "Hello World"}
`
        }
      },
      {
        id: '16-04-sec3',
        type: 'implementation',
        title: 'Custom Business Metrics',
        content: `While HTTP metrics are great, observability often requires domain-specific metrics. We use the \`prometheus_client\` library to define custom metrics, such as counting specific business events or measuring the size of items processed.`,
        codeExample: {
          id: '16-04-code2',
          language: 'python',
          title: 'Custom Metrics',
          filename: 'app/metrics.py',
          code: `from prometheus_client import Counter, Gauge, Histogram
import time

# 1. Counter: Tracking business events
ITEMS_PROCESSED = Counter(
    "app_items_processed_total",
    "Total number of items processed",
    labelnames=["item_type", "status"]
)

# 2. Gauge: Tracking state
ACTIVE_BACKGROUND_JOBS = Gauge(
    "app_active_background_jobs",
    "Number of currently running background jobs"
)

# 3. Histogram: Measuring specific operation latency
DB_QUERY_LATENCY = Histogram(
    "app_db_query_duration_seconds",
    "Database query latency in seconds",
    labelnames=["table", "operation"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

# Usage example in a service:
def process_item(item_type: str):
    start_time = time.time()
    ACTIVE_BACKGROUND_JOBS.inc()
    
    try:
        # Simulate processing...
        pass
        ITEMS_PROCESSED.labels(item_type=item_type, status="success").inc()
    except Exception:
        ITEMS_PROCESSED.labels(item_type=item_type, status="error").inc()
        raise
    finally:
        ACTIVE_BACKGROUND_JOBS.dec()
        duration = time.time() - start_time
        DB_QUERY_LATENCY.labels(table="items", operation="insert").observe(duration)
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-04-chal',
        title: 'Identify the Issue',
        description: 'You noticed memory continuously growing in your application after defining a Prometheus Counter with a user ID label: `Counter("logins", labels=["user_id"])`. Why?',
        hint: 'Think about cardinality and how Prometheus stores time-series data internally.',
        solution: 'Label cardinality explosion. Every unique combination of labels creates a new time-series in memory. If you have a million users, you create a million series. Labels should only be used for bounded, low-cardinality values (e.g., status codes, HTTP methods). User IDs belong in logs or traces, never in metrics.',
        solutionCode: {
          id: '16-04-chal-sol',
          language: 'python',
          title: 'No code needed',
          filename: 'concept.txt',
          code: 'Conceptual challenge'
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-04-pn1',
        severity: 'warning',
        content: 'When using multiprocess deployments (like Uvicorn workers managed by Gunicorn), standard prometheus_client metrics behave unpredictably because each worker has its own memory space. You must use Prometheus multiprocess mode or a multiprocess-aware library to aggregate metrics across workers.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'grafana-dashboards': {
    id: '16-05',
    slug: 'grafana-dashboards',
    chapterId: 16,
    order: 5,
    title: 'Grafana Dashboard Design',
    description: 'Design effective Grafana dashboards using PromQL to visualize FastAPI performance.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.grafana, technologies.prometheus],
    prerequisites: ['16-04'],
    objectives: [
      'Write PromQL queries to calculate error rates and latencies.',
      'Structure dashboards using the RED (Rate, Errors, Duration) method.',
      'Import and manage dashboards as code using JSON.',
    ],
    sections: [
      {
        id: '16-05-sec1',
        type: 'concept',
        title: 'The RED Method',
        content: `When designing dashboards for web services like FastAPI APIs, the industry standard is the **RED method**:
- **Rate**: Number of requests per second.
- **Errors**: Number or percentage of those requests that are failing.
- **Duration**: The time those requests take (usually p95 or p99).

A well-designed dashboard places these three metrics at the very top. This provides instant situational awareness. If Rate drops, you have a networking or upstream issue. If Errors spike, you have a bug or dependency failure. If Duration spikes, you have a performance bottleneck or database issue.`,
      },
      {
        id: '16-05-sec2',
        type: 'implementation',
        title: 'Essential PromQL Queries',
        content: `Assuming you are using the \`prometheus-fastapi-instrumentator\`, here are the fundamental PromQL queries you need for your RED dashboard panels. Note the use of \`rate()\` which calculates the per-second average rate of increase of a time series.`,
        codeExample: {
          id: '16-05-code1',
          language: 'python',
          title: 'PromQL Queries',
          filename: 'queries.promql',
          code: `# Rate: Total Requests Per Second (RPS)
sum(rate(http_requests_total{job="fastapi-app"}[1m]))

# Errors: 5xx Error Percentage
sum(rate(http_requests_total{job="fastapi-app", status=~"5.."}[1m])) 
/ 
sum(rate(http_requests_total{job="fastapi-app"}[1m])) 
* 100

# Duration: p95 Latency using Histogram
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="fastapi-app"}[5m])) by (le))`
        }
      },
      {
        id: '16-05-sec3',
        type: 'architecture',
        title: 'Dashboards as Code',
        content: `In production, dashboards should not be created manually in the UI. They should be exported as JSON and provisioned automatically during deployment. This ensures version control, peer review, and disaster recovery. Grafana allows declarative provisioning via YAML configuration pointing to a directory of JSON dashboards.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-05-chal',
        title: 'Exclude Health Checks',
        description: 'Modify the RPS query to exclude traffic to the `/health` endpoint.',
        hint: 'Use a negative regex match `!=` or `!~` on the handler/path label.',
        solution: 'Assuming the instrumentator labels endpoints as `handler`, use `handler!="/health"`.',
        solutionCode: {
          id: '16-05-chal-sol',
          language: 'python',
          title: 'Filtered Query',
          filename: 'query.promql',
          code: `sum(rate(http_requests_total{job="fastapi-app", handler!="/health"}[1m]))`
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-05-pn1',
        severity: 'info',
        content: 'Use Grafana Variables (templating) to allow users to filter dashboards by environment (staging/prod), region, or specific service instance without creating duplicate dashboards.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'opentelemetry-tracing': {
    id: '16-06',
    slug: 'opentelemetry-tracing',
    chapterId: 16,
    order: 6,
    title: 'OpenTelemetry Distributed Tracing',
    description: 'Implement distributed tracing with OpenTelemetry to track requests across services.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.opentelemetry, technologies.fastapi],
    prerequisites: ['16-03'],
    objectives: [
      'Understand Spans, Traces, and the OpenTelemetry architecture.',
      'Configure auto-instrumentation for FastAPI, SQLAlchemy, and httpx.',
      'Export traces to a backend like Jaeger or Tempo.',
    ],
    sections: [
      {
        id: '16-06-sec1',
        type: 'concept',
        title: 'Spans and Traces',
        content: `While Correlation IDs are a manual way to link logs, Distributed Tracing provides a unified standard (OpenTelemetry) and dedicated UIs for visualizing request flow. 

The building block is a **Span**. A span represents a single operation (e.g., an HTTP request, a DB query, a function execution) and has a start time, end time, and metadata (attributes). 

A **Trace** is a tree of spans representing the entire journey of a request. The root span might be the incoming API request, and its child spans could be a cache lookup, followed by a database query. OpenTelemetry (OTel) provides SDKs to automatically generate these spans and export them to backends like Jaeger, Zipkin, or Grafana Tempo for visualization as Gantt charts.`,
      },
      {
        id: '16-06-sec2',
        type: 'implementation',
        title: 'OpenTelemetry Bootstrapping',
        content: `Configuring OTel requires setting up a TracerProvider, a BatchSpanProcessor, and an Exporter. Auto-instrumentation libraries will hook into FastAPI and underlying libraries (like SQLAlchemy) to automatically create spans.`,
        codeExample: {
          id: '16-06-code1',
          language: 'python',
          title: 'OTel Setup',
          filename: 'app/tracing.py',
          code: `from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

def setup_tracing(app, engine):
    # 1. Setup Resource (Service Identity)
    resource = Resource(attributes={
        SERVICE_NAME: "my-fastapi-service"
    })
    
    # 2. Setup Provider
    provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(provider)
    
    # 3. Setup Exporter (Sending to an OTLP Collector / Jaeger)
    otlp_exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317")
    processor = BatchSpanProcessor(otlp_exporter)
    provider.add_span_processor(processor)
    
    # 4. Auto-Instrumentation
    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(engine=engine)
    HTTPXClientInstrumentor().instrument()
`
        }
      },
      {
        id: '16-06-sec3',
        type: 'implementation',
        title: 'Creating Custom Spans',
        content: `While auto-instrumentation covers HTTP and DB calls, you often want to trace specific internal functions or add business context (attributes) to the current span.`,
        codeExample: {
          id: '16-06-code2',
          language: 'python',
          title: 'Custom Spans',
          filename: 'app/services.py',
          code: `from opentelemetry import trace

tracer = trace.get_tracer(__name__)

async def process_complex_calculation(data: dict):
    # Get the current active span (created by FastAPI instrumentator)
    current_span = trace.get_current_span()
    current_span.set_attribute("app.data_size", len(data))
    
    # Create a new child span for a specific operation
    with tracer.start_as_current_span("heavy_compute_task") as span:
        span.set_attribute("app.algorithm", "v2")
        try:
            # Do heavy work...
            result = {"status": "ok"}
            span.add_event("Computation finished")
            return result
        except Exception as e:
            # Record exceptions in the span
            span.record_exception(e)
            span.set_status(trace.status.Status(trace.status.StatusCode.ERROR))
            raise
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-06-chal',
        title: 'The Missing Link',
        description: 'You instrumented FastAPI and SQLAlchemy, but when looking at Jaeger, the HTTP request span and the DB query span are disconnected (they show up as two separate traces). What is likely missing?',
        hint: 'Context propagation ensures spans are linked. How does the context flow?',
        solution: 'The OpenTelemetry context must be propagated. If SQLAlchemy instrumentator is missing or configured incorrectly, it might not pick up the current OpenTelemetry context. Ensure that your DB calls are running within the same async task/thread context as the HTTP request.',
        solutionCode: {
          id: '16-06-chal-sol',
          language: 'python',
          title: 'No code needed',
          filename: 'concept.txt',
          code: 'Conceptual challenge'
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-06-pn1',
        severity: 'critical',
        content: 'Tracing 100% of requests in high-traffic production environments generates massive amounts of data. Use tail-based sampling at the OTel Collector level to retain only slow requests or errors, plus a small percentage (e.g., 5%) of successful requests.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'trace-context-propagation': {
    id: '16-07',
    slug: 'trace-context-propagation',
    chapterId: 16,
    order: 7,
    title: 'Trace Context Propagation',
    description: 'Ensure OpenTelemetry context is preserved across network boundaries and background queues.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.opentelemetry, technologies.celery, technologies.fastapi],
    prerequisites: ['16-06'],
    objectives: [
      'Understand the W3C Trace Context specification.',
      'Propagate context via HTTP headers manually if needed.',
      'Implement tracing across message queues like Celery or RabbitMQ.',
    ],
    sections: [
      {
        id: '16-07-sec1',
        type: 'concept',
        title: 'The W3C Trace Context',
        content: `When Service A calls Service B, how does Service B know it should attach its spans to Service A's trace? 

The industry standard is the W3C Trace Context specification. It defines standard HTTP headers, primarily \`traceparent\`, which encodes the Trace ID, the parent Span ID, and sampling flags. 
Format: \`00-{trace-id}-{parent-span-id}-{trace-flags}\`

OpenTelemetry's HTTP instrumentators automatically inject this header into outgoing requests and extract it from incoming requests. However, when crossing non-HTTP boundaries (like sending a message to a Kafka topic or enqueuing a Celery task), you must ensure this context is manually or automatically propagated.`,
      },
      {
        id: '16-07-sec2',
        type: 'implementation',
        title: 'Tracing Celery Background Tasks',
        content: `Celery requires explicit instrumentation so that when a task is enqueued, the current trace context is injected into the message headers, and when the worker picks it up, it extracts the context to continue the trace.`,
        codeExample: {
          id: '16-07-code1',
          language: 'python',
          title: 'Celery Instrumentation',
          filename: 'worker/celery_app.py',
          code: `from celery import Celery
from celery.signals import worker_process_init
from opentelemetry import trace
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.sdk.trace import TracerProvider

app = Celery('tasks', broker='redis://localhost:6379/0')

# This must be called BEFORE task definition
CeleryInstrumentor().instrument()

@worker_process_init.connect(weak=False)
def init_celery_tracing(*args, **kwargs):
    # Setup tracing for the worker process
    # (Similar to FastAPI setup: resource, provider, exporter)
    provider = TracerProvider()
    trace.set_tracer_provider(provider)
    # add exporters...

@app.task
def process_report(report_id: int):
    # This task is now automatically wrapped in a span!
    # And it correctly links back to the FastAPI span that enqueued it.
    print(f"Processing {report_id}")
`
        }
      },
      {
        id: '16-07-sec3',
        type: 'implementation',
        title: 'Manual Context Injection/Extraction',
        content: `If you are using a custom message queue (e.g., raw RabbitMQ via aio_pika) where auto-instrumentation isn't available, you use the OTel propagators API.`,
        codeExample: {
          id: '16-07-code2',
          language: 'python',
          title: 'Manual Propagation',
          filename: 'app/messaging.py',
          code: `from opentelemetry import trace, propagate

tracer = trace.get_tracer(__name__)

# --- PUBLISHER SIDE ---
async def publish_message(payload: dict):
    with tracer.start_as_current_span("publish_to_queue") as span:
        headers = {}
        # Inject current context into the headers dict
        propagate.inject(headers)
        
        # Send message with headers (pseudo-code)
        # mq_client.publish(payload, headers=headers)
        return True

# --- CONSUMER SIDE ---
async def consume_message(payload: dict, headers: dict):
    # Extract context from received headers
    ctx = propagate.extract(headers)
    
    # Start span with the extracted context
    with tracer.start_as_current_span("process_message", context=ctx) as span:
        # Do work...
        pass
`
        }
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-07-chal',
        title: 'Traceparent Format',
        description: 'Given the header `traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`, identify the Trace ID and the Parent Span ID.',
        hint: 'The format is Version - Trace ID - Span ID - Flags.',
        solution: 'Trace ID is `4bf92f3577b34da6a3ce929d0e0e4736` (32 hex characters). Parent Span ID is `00f067aa0ba902b7` (16 hex characters).',
        solutionCode: {
          id: '16-07-chal-sol',
          language: 'python',
          title: 'No code needed',
          filename: 'concept.txt',
          code: 'Conceptual challenge'
        }
      }
    ],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-07-pn1',
        severity: 'warning',
        content: 'When tracing background jobs that process batches (e.g., reading 100 messages at once), standard parent-child spans break down. OpenTelemetry defines "Span Links" to associate a single batch processing span with multiple independent message traces.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'health-check-endpoints': {
    id: '16-08',
    slug: 'health-check-endpoints',
    chapterId: 16,
    order: 8,
    title: 'Health Check Endpoints',
    description: 'Design robust health, readiness, and liveness probes for containerized environments.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.kubernetes],
    prerequisites: ['16-04'],
    objectives: [
      'Differentiate between Liveness and Readiness probes.',
      'Implement deep health checks for database and cache connections.',
      'Avoid cascading failures caused by aggressive health checks.',
    ],
    sections: [
      {
        id: '16-08-sec1',
        type: 'concept',
        title: 'Liveness vs Readiness',
        content: `In orchestration systems like Kubernetes, health checks serve two distinct purposes:
        
**Liveness Probes**: Ask "Is the application dead?" If liveness fails, Kubernetes forcefully restarts the container. This should be a simple, lightweight check that ensures the event loop is responsive. It should NOT check external databases.

**Readiness Probes**: Ask "Can the application handle traffic right now?" If readiness fails, Kubernetes stops sending traffic to the pod but does not kill it. This is where you check dependencies (database, Redis). If the DB is temporarily down, you want traffic to stop, but killing the app won't fix the DB.`,
      },
      {
        id: '16-08-sec2',
        type: 'implementation',
        title: 'Implementing Health Endpoints',
        content: `We will create a lightweight \`/health/live\` endpoint and a heavier \`/health/ready\` endpoint that actually pings the database.`,
        codeExample: {
          id: '16-08-code1',
          language: 'python',
          title: 'Health Router',
          filename: 'app/routers/health.py',
          code: `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db import get_session
import time

router = APIRouter(prefix="/health", tags=["Health"])

# Liveness: Is the process running and the event loop unblocked?
@router.get("/live", status_code=status.HTTP_200_OK)
async def check_liveness():
    return {"status": "ok", "timestamp": time.time()}

# Readiness: Can we connect to our critical dependencies?
@router.get("/ready")
async def check_readiness(db: AsyncSession = Depends(get_session)):
    health_status = {"status": "ok", "dependencies": {}}
    
    # Check Database
    try:
        # Fast query just to ensure connection is viable
        await db.execute(text("SELECT 1"))
        health_status["dependencies"]["database"] = "up"
    except Exception as e:
        health_status["status"] = "error"
        health_status["dependencies"]["database"] = "down"
        # If not ready, return 503 Service Unavailable
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail=health_status
        )
        
    return health_status
`
        }
      },
      {
        id: '16-08-sec3',
        type: 'production',
        title: 'Caching Health Checks',
        content: `If your readiness probe checks the database, and you have 50 pods, and Kubernetes probes them every 5 seconds, that's 10 DB queries per second purely for health checks. To mitigate this, especially during scaling events, deep health checks should cache their results for a few seconds.`
      }
    ],
    codeExamples: [],
    challenges: [
      {
        id: '16-08-chal',
        title: 'Implement Health Caching',
        description: 'How would you quickly cache the result of the database check in the readiness endpoint for 10 seconds to prevent DB overload?',
        hint: 'You can use a global variable to store the last check time and result, or a library like cachetools.',
        solution: 'Use a simple TTL cache or store a global timestamp. If `time.time() - last_check < 10`, return the cached result instead of hitting the DB.',
        solutionCode: {
          id: '16-08-chal-sol',
          language: 'python',
          title: 'Cached Readiness',
          filename: 'app/health.py',
          code: `import time
from cachetools import TTLCache, cached

# Cache the result for 10 seconds
cache = TTLCache(maxsize=1, ttl=10)

@cached(cache)
async def perform_db_check(db):
    await db.execute(text("SELECT 1"))
    return True
`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '16-08-int1',
        question: 'Why is it a catastrophic mistake to check the database in a Liveness probe?',
        answer: 'If the database experiences a temporary hiccup, the liveness probe fails. Kubernetes will then restart ALL your application pods simultaneously. When they restart, they will immediately bombard the struggling database with connection requests (connection storms), likely keeping the database down and causing a complete cascading failure.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '16-08-pn1',
        severity: 'critical',
        content: 'Ensure your health check endpoints are excluded from authentication, logging middlewares, and tracing (or at least aggressively sampled out). Otherwise, they will drown out real traffic in your observability tools.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'error-tracking-sentry': {
    id: '16-09',
    slug: 'error-tracking-sentry',
    chapterId: 16,
    order: 9,
    title: 'Error Tracking with Sentry',
    description: 'Integrate Sentry to capture unhandled exceptions, local variables, and performance profiles.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: ['15-10'],
    objectives: [
      'Integrate the sentry-sdk with FastAPI.',
      'Attach user context to exceptions.',
      'Configure environment and release tracking.',
    ],
    sections: [
      {
        id: '16-09-sec1',
        type: 'concept',
        title: 'Beyond Standard Logs',
        content: `While standard logs contain tracebacks, they lack deep context. If a \`KeyError\` occurs, the log won't tell you *what* the dictionary contained, or what the local variables were at each frame of the stack trace. 

Error tracking platforms like Sentry solve this. They hook directly into the Python exception handler. When an unhandled exception bubbles up, Sentry captures the complete traceback, the values of local variables at every stack frame, the incoming HTTP request data, and the system environment, sending it all as a single issue to their platform for triage.`,
      },
      {
        id: '16-09-sec2',
        type: 'implementation',
        title: 'Sentry Integration',
        content: `Integrating Sentry with FastAPI is remarkably simple using the provided integration module.`,
        codeExample: {
          id: '16-09-code1',
          language: 'python',
          title: 'Sentry Setup',
          filename: 'app/main.py',
          code: `import sentry_sdk
from fastapi import FastAPI
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from app.config import settings

# Initialize Sentry before creating the FastAPI app
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.ENVIRONMENT, # e.g., "production"
    release=f"my-app@{settings.VERSION}",
    integrations=[
        FastApiIntegration(transaction_style="endpoint"),
        SqlalchemyIntegration(),
    ],
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # In prod, this should be a lower value (e.g., 0.1)
    traces_sample_rate=0.1,
    
    # Prevent sending PII automatically
    send_default_pii=False,
)

app = FastAPI()
`
        }
      },
      {
        id: '16-09-sec3',
        type: 'implementation',
        title: 'Attaching User Context',
        content: `To make errors actionable, you should attach the current user's ID to the Sentry scope. This allows you to see exactly *who* experienced the error, or query Sentry for "all errors affecting User 123".`,
        codeExample: {
          id: '16-09-code2',
          language: 'python',
          title: 'User Context Middleware',
          filename: 'app/middleware.py',
          code: `import sentry_sdk
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SentryUserMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Assuming you have a mechanism that sets request.state.user
        # earlier in the middleware stack or via dependencies
        
        # We must use configure_scope to add data for this request
        with sentry_sdk.configure_scope() as scope:
            user = getattr(request.state, "user", None)
            if user:
                scope.set_user({"id": str(user.id), "email": user.email})
            
            # You can also attach custom tags
            scope.set_tag("tenant_id", getattr(request.state, "tenant", "unknown"))
            
            response = await call_next(request)
            return response
`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-09-pn1',
        severity: 'critical',
        content: 'Data Scrubbing: Sentry captures local variables in stack traces. If a variable is named `password` or `api_key`, it might be sent to Sentry. Use Sentry\'s UI data scrubbing rules or configure the SDK\'s `before_send` hook to sanitize sensitive data client-side before transmission.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'slo-sli-error-budgets': {
    id: '16-10',
    slug: 'slo-sli-error-budgets',
    chapterId: 16,
    order: 10,
    title: 'SLOs, SLIs & Error Budgets',
    description: 'Define and track Service Level Objectives (SLOs) to align engineering and business goals.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.prometheus, technologies.grafana],
    prerequisites: ['16-05'],
    objectives: [
      'Define Service Level Indicators (SLIs).',
      'Establish realistic Service Level Objectives (SLOs).',
      'Calculate and utilize Error Budgets.',
    ],
    sections: [
      {
        id: '16-10-sec1',
        type: 'concept',
        title: 'The SRE Terminology',
        content: `Pioneered by Google Site Reliability Engineering (SRE), this framework objectifies reliability:

**SLI (Service Level Indicator)**: A measurable metric over a time window. Usually expressed as a proportion of successful events. Example: "Percentage of HTTP requests that returned a 2xx or 3xx status code in the last 30 days."

**SLO (Service Level Objective)**: A target value for the SLI. Example: "99.9% of HTTP requests will be successful over a rolling 30-day window." (99.9% is often called "three nines").

**SLA (Service Level Agreement)**: A legal/business contract detailing what happens if the SLO is missed (e.g., refunding customers). Engineering focuses on SLOs; legal focuses on SLAs.

**Error Budget**: 100% minus the SLO. If your SLO is 99.9%, your error budget is 0.1%. If you serve 1 million requests a month, your budget is 1,000 errors. You *spend* this budget on deployments, experiments, or outages. If the budget is depleted, feature development pauses and the team focuses entirely on reliability.`,
      },
      {
        id: '16-10-sec2',
        type: 'implementation',
        title: 'Defining SLIs in PromQL',
        content: `SLIs are typically defined mathematically as: ` + "`(Good Events / Valid Events) * 100`" + `. We can calculate this using Prometheus Recording Rules.`,
        codeExample: {
          id: '16-10-code1',
          language: 'python',
          title: 'Prometheus Rules',
          filename: 'prometheus_rules.yml',
          code: `groups:
  - name: fastapi_slis
    rules:
      # Record the total number of valid requests (excluding 4xx which are client errors)
      - record: job:http_requests:valid_total
        expr: sum(rate(http_requests_total{job="fastapi-app", status!~"4.."}[5m]))
        
      # Record the total number of good requests (2xx, 3xx)
      - record: job:http_requests:good_total
        expr: sum(rate(http_requests_total{job="fastapi-app", status=~"2..|3.."}[5m]))
        
      # Calculate the SLI (Success Rate)
      - record: sli:http_success_rate:ratio
        expr: job:http_requests:good_total / job:http_requests:valid_total`
        }
      },
      {
        id: '16-10-sec3',
        type: 'architecture',
        title: 'Alerting on Burn Rates',
        content: `Don't alert when an error happens. Alert when your Error Budget is burning too fast. If your error rate is slightly elevated, it might take 2 weeks to burn the budget—don't wake an engineer at 2 AM for that (page during business hours). If the budget will be exhausted in 4 hours, sound the alarm immediately. This multi-window burn rate alerting prevents alert fatigue.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-10-pn1',
        severity: 'info',
        content: 'Aim for 99.9% rather than 100%. 100% reliability is impossible in distributed systems, mathematically expensive to attempt, and stifles innovation. The goal is to be "reliable enough".'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'capacity-planning': {
    id: '16-11',
    slug: 'capacity-planning',
    chapterId: 16,
    order: 11,
    title: 'Capacity Planning with Metrics',
    description: 'Use historical metrics to forecast application scaling needs.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.prometheus, technologies.grafana, technologies.kubernetes],
    prerequisites: ['16-10'],
    objectives: [
      'Analyze historical traffic patterns and resource usage.',
      'Configure Horizontal Pod Autoscaling (HPA) based on custom metrics.',
      'Perform load testing to establish baseline resource requirements.',
    ],
    sections: [
      {
        id: '16-11-sec1',
        type: 'concept',
        title: 'Forecasting and Baselines',
        content: `Capacity planning answers the question: "How much CPU/Memory do we need for the Black Friday sale?" 
        
By analyzing long-term metrics in Prometheus (using aggregation platforms like Thanos or Cortex for long-term storage), you can identify daily/weekly seasonality and long-term growth trends. A crucial step is establishing a baseline: how many Requests Per Second (RPS) can a single Pod handle before p95 latency degrades past your SLO? 
If 1 Pod handles 50 RPS, and you forecast 500 RPS, you need at least 10 Pods.`,
      },
      {
        id: '16-11-sec2',
        type: 'implementation',
        title: 'PromQL Linear Regression',
        content: `Prometheus includes functions to predict future values based on past trends. \`predict_linear\` calculates a simple linear regression over a time range.`,
        codeExample: {
          id: '16-11-code1',
          language: 'python',
          title: 'Prediction Alert',
          filename: 'alerts.yml',
          code: `groups:
- name: capacity_planning
  rules:
  - alert: DiskSpaceWillFillIn4Hours
    expr: |
      predict_linear(node_filesystem_free_bytes{job="node"}[1h], 4 * 3600) < 0
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Disk space will be exhausted soon"`
        }
      },
      {
        id: '16-11-sec3',
        type: 'architecture',
        title: 'Custom Metrics Autoscaling',
        content: `Kubernetes HPA scales pods based on CPU/Memory out of the box. But FastAPI applications often scale better based on HTTP Requests Per Second or queue length. Using the Prometheus Adapter, you can expose PromQL metrics to Kubernetes, allowing you to say: "Scale up when average RPS per pod exceeds 40."`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-11-pn1',
        severity: 'warning',
        content: 'Never autoscale based on database CPU utilization. If the DB is saturated, scaling up the application tier will only add MORE connections and load to the DB, hastening its collapse.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'observability-in-ci': {
    id: '16-12',
    slug: 'observability-in-ci',
    chapterId: 16,
    order: 12,
    title: 'Observability in CI: Performance Regression Tests',
    description: 'Use observability tools in CI pipelines to catch performance regressions before deployment.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.prometheus, technologies.github_actions],
    prerequisites: ['16-04'],
    objectives: [
      'Run ephemeral load tests in CI.',
      'Assert against Prometheus metrics in tests.',
      'Block PRs that cause significant latency regressions.',
    ],
    sections: [
      {
        id: '16-12-sec1',
        type: 'concept',
        title: 'Shifting Left',
        content: `Observability is usually considered a production concern (the right side of the DevOps loop). "Shifting left" means bringing those principles into CI/CD. 

If a developer adds an N+1 query to a FastAPI route, unit tests will pass (functionality works), but production latency will spike. By spinning up the app, a database, and an ephemeral Prometheus instance in GitHub Actions, you can run a synthetic load test (using tools like Locust or k6) and programmatically query Prometheus to assert that p95 latency remains below a threshold.`,
      },
      {
        id: '16-12-sec2',
        type: 'implementation',
        title: 'Querying Prometheus in Tests',
        content: `You can use Python testing frameworks to hit the Prometheus API after a load test to validate performance assertions.`,
        codeExample: {
          id: '16-12-code1',
          language: 'python',
          title: 'Performance Assertions',
          filename: 'tests/test_performance.py',
          code: `import httpx
import pytest

PROMETHEUS_URL = "http://localhost:9090"

@pytest.mark.asyncio
async def test_api_latency_under_load():
    # 1. Run your load generator (e.g., k6 or Locust) against the app
    # run_load_test()
    
    # 2. Query Prometheus for the p95 latency over the last 5 minutes
    query = 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{PROMETHEUS_URL}/api/v1/query",
            params={"query": query}
        )
        data = response.json()
        
        # 3. Assert on the result
        results = data.get("data", {}).get("result", [])
        assert len(results) > 0, "No metrics found"
        
        p95_latency = float(results[0]["value"][1])
        
        # Assert p95 latency is less than 200ms
        assert p95_latency < 0.200, f"Performance regression! p95 Latency: {p95_latency}s"
`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-12-pn1',
        severity: 'info',
        content: 'CI runners have variable performance. Hard-coded latency thresholds (e.g., < 200ms) might be flaky. A better approach is comparative: run the load test against the `main` branch, then against the PR branch, and assert the degradation is < 5%.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  },
  'distributed-tracing-best-practices': {
    id: '16-13',
    slug: 'distributed-tracing-best-practices',
    chapterId: 16,
    order: 13,
    title: 'Distributed Tracing Best Practices',
    description: 'Advanced patterns and anti-patterns for instrumenting complex applications.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.opentelemetry, technologies.fastapi],
    prerequisites: ['16-06'],
    objectives: [
      'Manage high-cardinality attributes in spans.',
      'Implement intelligent sampling strategies.',
      'Correlate traces with business metrics (Exemplars).',
    ],
    sections: [
      {
        id: '16-13-sec1',
        type: 'concept',
        title: 'Sampling Strategies',
        content: `You cannot afford to store 100% of traces for a high-traffic service.
        
**Head-based sampling**: The decision to sample is made at the beginning of the request (e.g., "sample 1% of requests randomly"). The problem: if an error happens in the 99% that weren't sampled, you have no trace for it.

**Tail-based sampling**: All traces are collected by an intermediate component (like OTel Collector). The decision to keep them is made *after* the trace completes. This allows you to say: "Keep 100% of traces containing an error, 100% of traces taking longer than 2 seconds, and 1% of everything else." This is the gold standard for production.`,
      },
      {
        id: '16-13-sec2',
        type: 'implementation',
        title: 'Semantic Conventions',
        content: `When adding custom attributes to spans, adhere to OpenTelemetry Semantic Conventions. Instead of naming an attribute \`user_id\` in one service and \`user.id\` in another, standardize.`,
        codeExample: {
          id: '16-13-code1',
          language: 'python',
          title: 'Semantic Attributes',
          filename: 'app/utils.py',
          code: `from opentelemetry import trace
from opentelemetry.semconv.trace import SpanAttributes

# SpanAttributes provides standardized string constants
# e.g., SpanAttributes.HTTP_METHOD is 'http.method'

def enrich_span_with_user(user):
    span = trace.get_current_span()
    if span.is_recording():
        # Custom business attributes should generally be prefixed 
        # with your company/app name, e.g., 'myapp.'
        span.set_attribute("myapp.user.id", user.id)
        span.set_attribute("myapp.user.tier", user.subscription_tier)
`
        }
      },
      {
        id: '16-13-sec3',
        type: 'concept',
        title: 'Exemplars',
        content: `Exemplars bridge the gap between metrics and traces. When Prometheus scrapes a histogram metric, it can also pull an "exemplar"—a specific Trace ID that fell into that bucket. In Grafana, when viewing a latency spike on a dashboard, exemplars appear as dots on the graph. Clicking a dot takes you directly to the Jaeger trace that caused that specific latency measurement, providing a seamless "single pane of glass" debugging experience.`
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [
      {
        id: '16-13-pn1',
        severity: 'warning',
        content: 'Do not use spans for long-running batch jobs that take hours (e.g., ML training). Spans are meant to be kept in memory until complete; long-running processes will cause OOM errors in the tracer. Use metrics and structured logs for batch job observability instead.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: []
  }
};
