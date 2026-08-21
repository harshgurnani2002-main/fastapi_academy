import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch23Lessons: Record<string, Lesson> = {
  'microservices-vs-monolith': {
    id: '23-01',
    slug: 'microservices-vs-monolith',
    chapterId: 23,
    order: 1,
    title: 'Microservices vs Monolith: The Real Trade-offs',
    description: 'Understand when to use microservices and the hidden costs involved.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.fastapi],
    prerequisites: [],
    objectives: [
      'List concrete benefits of microservices',
      'List concrete costs (operational, latency, data)',
      'Identify signals that a monolith needs to be split',
      'Design a modular monolith as an alternative'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Reality of Microservices',
        content: `Microservices architecture is often touted as the ultimate solution for scaling applications, but the reality is much more nuanced. Moving from a monolith to microservices trades complexity in the codebase for complexity in the infrastructure. In a monolith, method calls are in-memory and transaction management is straightforward. In a microservices architecture, every service interaction involves a network call, introducing latency, potential network failures, and complex distributed data management.\n\nThe real benefit of microservices is often organizational, not purely technical. It allows independent teams to develop, deploy, and scale their services independently, reducing the coordination overhead in large organizations. If you don't have multiple teams tripping over each other in a monolithic codebase, you probably don't need microservices.`
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'The Modular Monolith Alternative',
        content: `Before jumping to microservices, consider a modular monolith. A modular monolith enforces strict boundaries between different modules (e.g., using Python packages or separate FastAPI routers with restricted imports) while keeping everything in a single deployment unit and database. This gives you many of the organizational benefits (independent modules) without the distributed systems tax. You can use tools like \`import-linter\` to ensure boundaries are respected.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Modular Monolith Structure',
          files: {
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI\nfrom app.orders.router import router as orders_router\nfrom app.users.router import router as users_router\n\napp = FastAPI()\n\napp.include_router(orders_router, prefix="/orders")\napp.include_router(users_router, prefix="/users")`
            },
            'app/orders/service.py': {
              language: 'python',
              code: `# Strict rule: orders cannot directly import from app.users.models\n# They must use a shared interface or API provided by the users module\nfrom app.users.interface import get_user_status\n\ndef create_order(user_id: int):\n    status = get_user_status(user_id)\n    if status != "active":\n        raise ValueError("Inactive user")\n    return {"order_id": 123, "status": "created"}`
            }
          }
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What are the main drawbacks of microservices?',
        answer: 'Increased operational complexity, network latency, distributed data management challenges (like distributed transactions), and harder end-to-end testing.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Do not adopt microservices just for technical scaling unless absolutely necessary; scale your monolith horizontally first.'
      }
    ],
    codeExamples: [],
    challenges: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'service-boundaries': {
    id: '23-02',
    slug: 'service-boundaries',
    chapterId: 23,
    order: 2,
    title: 'Service Boundary Design',
    description: 'Learn how to properly scope microservices using Domain-Driven Design.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.fastapi],
    prerequisites: ['23-01'],
    objectives: [
      'Identify bounded contexts from domain model',
      'Avoid splitting too finely (nano-services)',
      'Design loose coupling between services',
      'Define clear service ownership and responsibility'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Bounded Contexts',
        content: `Getting service boundaries wrong is the most common reason microservice migrations fail. If boundaries are drawn poorly, you end up with a "distributed monolith" where a single business capability requires changing multiple services simultaneously. The solution lies in Domain-Driven Design (DDD), specifically the concept of Bounded Contexts. A bounded context is a clear boundary within which a specific domain model applies. For example, a "User" in the Billing context might just be an ID and a credit card, while a "User" in the Support context is an email and a history of tickets.\n\nServices should be aligned with these bounded contexts, not with technical layers or single entities. A service should own its data and behavior entirely.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Avoiding Nano-services',
        content: `A common mistake is creating services that are too small—nano-services. This leads to excessive network chatter and complex orchestration. A service should represent a significant business capability, not just a single CRUD entity. It's better to start with larger, more cohesive services (macro-services) and split them later if necessary.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Cohesive Service Example',
          files: {
            'billing_service/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI\n\napp = FastAPI(title="Billing Service")\n\n# The billing service handles everything related to billing:\n# invoices, payments, subscriptions, and receipts.\n@app.post("/invoices")\ndef create_invoice():\n    pass\n\n@app.post("/payments")\ndef process_payment():\n    pass`
            }
          }
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Entity-Based Services',
        description: 'Creating a service for every database table (e.g., UserService, ProductService) leads to high coupling and poor performance.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: '❌ Nano-services',
          code: `# Needs to call ProductService, UserService, InventoryService just to place an order\ndef place_order(order_data):\n    pass`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: '✅ Capability-Based Services',
          code: `# OrderService handles the entire order placement workflow internally\ndef place_order(order_data):\n    pass`
        }
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'api-gateway-patterns': {
    id: '23-03',
    slug: 'api-gateway-patterns',
    chapterId: 23,
    order: 3,
    title: 'API Gateway Patterns',
    description: 'Implement API gateways to manage entry points into your microservices architecture.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.nginx, technologies.fastapi],
    prerequisites: ['23-01'],
    objectives: [
      'Implement authentication at the gateway layer',
      'Route requests to appropriate microservices',
      'Aggregate multiple service responses',
      'Handle gateway-level rate limiting'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Role of the API Gateway',
        content: `An API Gateway acts as the single entry point for all external clients into your microservices architecture. It handles cross-cutting concerns like authentication, rate limiting, and SSL termination. This offloads these responsibilities from individual microservices. The gateway also routes incoming requests to the appropriate backend service, hiding the internal architecture and service boundaries from the clients.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'API Gateway with Nginx and FastAPI',
        content: `While you can build an API gateway using standard reverse proxies like Nginx or Envoy, sometimes you need custom aggregation logic (Backend-for-Frontend pattern) which can be implemented in a FastAPI service.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'FastAPI BFF Gateway',
          files: {
            'gateway/main.py': {
              language: 'python',
              code: `import httpx\nfrom fastapi import FastAPI, Depends, HTTPException\n\napp = FastAPI()\n\nasync def verify_token(token: str):\n    # Simulate token verification\n    return {"user_id": 123}\n\n@app.get("/api/dashboard")\nasync def get_dashboard(user: dict = Depends(verify_token)):\n    async with httpx.AsyncClient() as client:\n        # Aggregate data from multiple services\n        orders_resp, profile_resp = await asyncio.gather(\n            client.get(f"http://orders-service/users/{user['user_id']}/orders"),\n            client.get(f"http://users-service/users/{user['user_id']}")\n        )\n        return {\n            "profile": profile_resp.json(),\n            "recent_orders": orders_resp.json()\n        }`
            }
          }
        }
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Do not put heavy business logic in the API gateway. It should be restricted to routing, auth, and simple aggregation.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'service-communication': {
    id: '23-04',
    slug: 'service-communication',
    chapterId: 23,
    order: 4,
    title: 'Service-to-Service Communication Patterns',
    description: 'Choose the right communication protocols between microservices.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.redis],
    prerequisites: ['23-02'],
    objectives: [
      'Use synchronous REST for immediate response needs',
      'Use async messaging for decoupled workflows',
      'Implement request hedging for latency reduction',
      'Handle service unavailability in callers'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Synchronous vs Asynchronous Communication',
        content: `When services need to interact, you must choose between synchronous (REST/gRPC) and asynchronous (message brokers) communication. Synchronous communication is easier to implement and reason about, but it tightly couples services temporally: if Service B is down, Service A fails. It also cascades latency.\n\nAsynchronous messaging decouples services. Service A publishes an event ("OrderCreated") and immediately returns to the user. Service B processes the event later. This provides resilience and better performance, but introduces eventual consistency and complex error handling.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Handling Resilience in Synchronous Calls',
        content: `When synchronous calls are necessary, you must build resilience into the caller. This includes using timeouts, retries with exponential backoff, and circuit breakers to prevent cascading failures.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Resilient Service Caller',
          files: {
            'app/client.py': {
              language: 'python',
              code: `import httpx\nfrom tenacity import retry, stop_after_attempt, wait_exponential\n\nclass PaymentClient:\n    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))\n    async def process_payment(self, payment_data: dict):\n        async with httpx.AsyncClient(timeout=3.0) as client:\n            response = await client.post("http://payment-service/charge", json=payment_data)\n            response.raise_for_status()\n            return response.json()`
            }
          }
        }
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'shared-database-antipattern': {
    id: '23-05',
    slug: 'shared-database-antipattern',
    chapterId: 23,
    order: 5,
    title: 'The Shared Database Anti-Pattern',
    description: 'Learn why sharing databases across microservices is dangerous and how to avoid it.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['23-01'],
    objectives: [
      'Identify shared database coupling problems',
      'Decompose a shared database incrementally',
      'Use the strangler fig pattern for migration',
      'Handle data duplication across services'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Database Coupling Problem',
        content: `A common anti-pattern in microservices is multiple services connecting directly to the same database. This completely negates the decoupling benefits of microservices. If Service A changes the schema of a shared table, Service B breaks. Furthermore, it creates a single point of failure and a scalability bottleneck.\n\nThe golden rule of microservices is Database-per-Service. A service's data should only be accessible via its API.`
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Decomposing the Database',
        content: `Moving from a shared database to database-per-service requires careful planning. You often have to migrate from foreign keys to API calls and handle data duplication. Sometimes, services need a read-only replica of another service's data to avoid constant API calls, which must be kept in sync via asynchronous events.`
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never allow multiple microservices to write to the same database tables. Enforce database ownership strictly.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'data-consistency-microservices': {
    id: '23-06',
    slug: 'data-consistency-microservices',
    chapterId: 23,
    order: 6,
    title: 'Data Consistency Across Microservices',
    description: 'Manage distributed transactions and eventual consistency.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.postgresql, technologies.redis],
    prerequisites: ['23-05'],
    objectives: [
      'Accept eventual consistency as the default',
      'Implement the outbox pattern cross-service',
      'Design compensating transactions for failures',
      'Monitor consistency lag between services'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Eventual Consistency',
        content: `In a monolithic system, ACID transactions guarantee strong consistency. In a microservices architecture with a database-per-service, distributed transactions (like Two-Phase Commit) are too slow and brittle. Instead, we embrace Eventual Consistency. Updates are propagated asynchronously, meaning there is a window of time where different services have different views of the data. The system eventually converges on a consistent state.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'The Outbox Pattern',
        content: `A critical problem is atomically updating a local database and publishing a message to a broker. If the database commit succeeds but the message publish fails, the system is inconsistent. The Transactional Outbox pattern solves this: you save the message to an 'outbox' table in the same transaction as the business data. A separate background process then reads the outbox table and publishes the messages to the broker.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Transactional Outbox',
          files: {
            'app/services/orders.py': {
              language: 'python',
              code: `from sqlalchemy.orm import Session\nfrom app.models import Order, OutboxMessage\nimport json\n\ndef create_order(db: Session, user_id: int, total: float):\n    # 1. Create order\n    order = Order(user_id=user_id, total=total, status="pending")\n    db.add(order)\n    db.flush() # Get order ID\n    \n    # 2. Create outbox event in the SAME transaction\n    event_payload = json.dumps({"order_id": order.id, "user_id": user_id})\n    outbox = OutboxMessage(topic="order_created", payload=event_payload)\n    db.add(outbox)\n    \n    # 3. Commit both atomically\n    db.commit()\n    return order`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Implement Compensating Transactions (Saga)',
        description: 'Design a workflow where if a payment fails, an already created order is cancelled.',
        hint: 'Use a message consumer that listens for PaymentFailed events and updates the order status.',
        solution: 'Implement the Saga pattern using choreography or orchestration.',
        solutionCode: {
          id: 'sc-1',
          language: 'python',
          title: 'Compensating Action',
          filename: 'consumer.py',
          code: `async def handle_payment_failed(event_data, db):\n    order_id = event_data['order_id']\n    order = db.query(Order).get(order_id)\n    if order:\n        order.status = "cancelled"\n        order.cancellation_reason = "payment_failed"\n        db.commit()`
        }
      }
    ],
    codeExamples: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'service-discovery': {
    id: '23-07',
    slug: 'service-discovery',
    chapterId: 23,
    order: 7,
    title: 'Service Discovery',
    description: 'How microservices find and communicate with each other dynamically.',
    duration: 40,
    difficulty: 'production',
    technologies: [technologies.kubernetes],
    prerequisites: ['23-04'],
    objectives: [
      'Use Kubernetes DNS for service discovery',
      'Implement client-side load balancing',
      'Handle service instance health',
      'Configure service mesh for advanced routing'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Dynamic Discovery',
        content: `In modern cloud environments, instances of microservices are constantly coming and going due to scaling or failures. Hardcoding IP addresses is impossible. Service Discovery mechanisms allow services to find each other using logical names. In Kubernetes, this is natively handled by the platform's DNS system and Services.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Kubernetes Service Discovery',
        content: `When you deploy a service in Kubernetes, you define a \`Service\` resource. Kubernetes automatically assigns it a DNS name (e.g., \`orders-service.default.svc.cluster.local\`). Other pods can simply make HTTP requests to this hostname, and Kubernetes handles the load balancing across the healthy pods backing that service.`
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'distributed-configuration': {
    id: '23-08',
    slug: 'distributed-configuration',
    chapterId: 23,
    order: 8,
    title: 'Distributed Configuration Management',
    description: 'Manage settings across dozens of independent microservices.',
    duration: 40,
    difficulty: 'production',
    technologies: [technologies.kubernetes, technologies.fastapi],
    prerequisites: ['23-01'],
    objectives: [
      'Use ConfigMaps for per-service config',
      'Implement feature flags across services',
      'Handle configuration hot-reloading',
      'Track configuration changes with audit logs'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Centralized vs Decentralized Configuration',
        content: `Managing environment variables for dozens of services becomes unwieldy. Distributed configuration management tools (like Consul, AWS Parameter Store, or Kubernetes ConfigMaps) provide a centralized way to store and inject configuration into services at startup or runtime.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Using Pydantic with External Config',
        content: `FastAPI integrates beautifully with Pydantic BaseSettings, which can easily load configurations mounted as files from Kubernetes ConfigMaps or fetched from external stores.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Loading Config in FastAPI',
          filename: 'config.py',
          code: `from pydantic_settings import BaseSettings\n\nclass Settings(BaseSettings):\n    database_url: str\n    api_key: str\n    feature_new_ui_enabled: bool = False\n\n    class Config:\n        # Can load from .env or env vars injected by K8s\n        env_file = ".env"\n\nsettings = Settings()`
        }
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'testing-microservices': {
    id: '23-09',
    slug: 'testing-microservices',
    chapterId: 23,
    order: 9,
    title: 'Testing in a Microservices World',
    description: 'Ensure system reliability without flaky end-to-end tests.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.pytest, technologies.fastapi, technologies.docker],
    prerequisites: ['23-01'],
    objectives: [
      'Use consumer-driven contracts with Pact',
      'Run integration tests with service stubs',
      'Limit end-to-end tests to critical paths',
      'Use Docker Compose for local service testing'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Testing Pyramid in Microservices',
        content: `Traditional end-to-end (E2E) testing across a microservices landscape is incredibly fragile, slow, and hard to maintain. A single broken service can fail hundreds of unrelated E2E tests. The solution is to shift the testing pyramid: rely heavily on comprehensive unit tests within services, use isolated integration tests with mocks/stubs for external dependencies, and utilize Contract Testing to ensure services can communicate correctly without spinning up the whole system.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Contract Testing',
        content: `Consumer-Driven Contract Testing (e.g., using Pact) allows the consumer of an API to define the exact shape of the response it expects (the contract). The provider service then runs tests against these contracts to ensure it hasn't broken compatibility. This verifies integration without needing both services running simultaneously.`
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'strangler-fig-migration': {
    id: '23-10',
    slug: 'strangler-fig-migration',
    chapterId: 23,
    order: 10,
    title: 'Strangler Fig: Migrating from Monolith',
    description: 'Safely extract microservices from an existing monolithic application.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.fastapi, technologies.nginx],
    prerequisites: ['23-01'],
    objectives: [
      'Identify extraction candidates by domain boundary',
      'Route traffic gradually to new service',
      'Handle data migration during extraction',
      'Validate new service parity before full cutover'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Strangler Fig Pattern',
        content: `A "big bang" rewrite from a monolith to microservices almost always fails. The proven approach is the Strangler Fig pattern. You put a proxy (like Nginx) in front of the monolith. You then extract one cohesive domain boundary into a new microservice. You configure the proxy to route traffic for that specific domain to the new service, while everything else goes to the monolith. Over time, the new services "strangle" the monolith until it can be retired.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'Routing with Nginx',
        content: `The API Gateway plays a crucial role here, allowing you to seamlessly route specific URL paths to the new services without client changes.`,
        codeExample: {
          id: 'code-1',
          language: 'nginx',
          title: 'Strangler Proxy Config',
          filename: 'nginx.conf',
          code: `server {\n    listen 80;\n\n    # The extracted service\n    location /api/v1/payments {\n        proxy_pass http://new-payment-service:8000;\n    }\n\n    # The legacy monolith\n    location / {\n        proxy_pass http://legacy-monolith:8080;\n    }\n}`
        }
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'microservices-observability': {
    id: '23-11',
    slug: 'microservices-observability',
    chapterId: 23,
    order: 11,
    title: 'Observability for Microservices',
    description: 'Trace requests across multiple service boundaries to debug production issues.',
    duration: 45,
    difficulty: 'production',
    technologies: [technologies.opentelemetry, technologies.fastapi, technologies.prometheus],
    prerequisites: ['23-01'],
    objectives: [
      'Propagate trace context across all services',
      'Centralize logs with correlation IDs',
      'Build service dependency topology maps',
      'Alert on cross-service error propagation'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'Distributed Tracing',
        content: `When a user request fails in a microservices architecture, finding the root cause is like finding a needle in a haystack if you only have scattered logs. Distributed tracing solves this by injecting a unique Trace ID at the gateway. This ID is passed along in HTTP headers to every downstream service. When each service logs or emits metrics, it includes this Trace ID, allowing tools like Jaeger or Datadog to reconstruct the entire request path.`
      },
      {
        id: 'sec-2',
        type: 'implementation',
        title: 'OpenTelemetry in FastAPI',
        content: `FastAPI integrates easily with OpenTelemetry to automatically instrument HTTP requests and database calls, propagating trace headers transparently.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'FastAPI OpenTelemetry',
          filename: 'main.py',
          code: `from fastapi import FastAPI\nfrom opentelemetry.instrumentation.fastapi import FastAPIInstrumentor\nimport httpx\n\napp = FastAPI()\n\n# Automatically instruments incoming requests and propagates headers\nFastAPIInstrumentor.instrument_app(app)\n\n@app.get("/chain")\nasync def call_downstream():\n    # Trace headers are automatically injected into this outgoing request\n    async with httpx.AsyncClient() as client:\n        await client.get("http://downstream-service/api")\n    return {"status": "ok"}`
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Silent Cascading Timeout',
        problem: 'A slow database query in Service D caused timeouts in Service C, which caused retries in Service B, eventually crashing the API Gateway (Service A).',
        solution: 'Implemented distributed tracing to identify the bottleneck in Service D. Added strict timeouts and circuit breakers to caller services.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'service-mesh': {
    id: '23-12',
    slug: 'service-mesh',
    chapterId: 23,
    order: 12,
    title: 'Service Mesh with Istio/Linkerd',
    description: 'Offload networking logic from application code to the infrastructure layer.',
    duration: 50,
    difficulty: 'production',
    technologies: [technologies.kubernetes],
    prerequisites: ['23-07'],
    objectives: [
      'Understand the sidecar proxy pattern',
      'Configure mTLS between services automatically',
      'Implement traffic shifting for canary releases',
      'Use service mesh for retry and timeout policies'
    ],
    sections: [
      {
        id: 'sec-1',
        type: 'concept',
        title: 'The Sidecar Pattern',
        content: `As your microservices architecture grows, implementing retries, circuit breaking, mTLS encryption, and tracing in every single service's code becomes a maintenance nightmare. A Service Mesh (like Istio or Linkerd) solves this using the Sidecar pattern. It injects a tiny, high-performance proxy (like Envoy) next to every microservice container. All network traffic goes through these proxies, allowing the mesh to handle networking concerns transparently.`
      },
      {
        id: 'sec-2',
        type: 'architecture',
        title: 'Capabilities of a Service Mesh',
        content: `With a service mesh in place, your application code is radically simplified. You can configure complex traffic routing (e.g., send 10% of traffic to a new canary version of a service) using Kubernetes custom resources, without changing a line of application code. It also provides automatic mutual TLS (mTLS) securing communication between services out of the box.`
      }
    ],
    interviewQuestions: [],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  }
};
