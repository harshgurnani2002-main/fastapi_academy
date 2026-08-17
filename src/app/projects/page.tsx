import { ProjectsList } from '@/components/projects/ProjectsList';
import { Project } from '@/components/projects/ProjectCard';

export const metadata = {
  title: 'Projects | FastAPI Mastery',
  description: '12 production-grade backend engineering projects.',
};

const projects: Project[] = [
  {
    id: 1, slug: 'fastapi-starter',
    title: 'Production FastAPI Starter Architecture',
    difficulty: 'advanced',
    hours: 16,
    chapter: 1,
    description: 'Build a production-ready FastAPI starter with clean architecture, dependency injection, repository pattern, and all engineering standards pre-configured.',
    architecture: 'Client\n  ↓\nFastAPI (ASGI)\n  ├─ PostgreSQL (SQLAlchemy)\n  ├─ Redis\n  └─ Celery Workers',
    techs: ['FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Python'],
    skills: ['Clean architecture', 'Repository pattern', 'DI system', 'Config management']
  },
  {
    id: 2, slug: 'auth-platform',
    title: 'Production Authentication Platform',
    difficulty: 'expert',
    hours: 12,
    chapter: 5,
    description: 'Implement a complete authentication service with Google OAuth 2.0, email/password, JWT with refresh tokens, RBAC, and Redis session management.',
    architecture: 'Client\n  ↓\nFastAPI\n  ├─ Google OAuth 2.0\n  ├─ JWT (Access + Refresh)\n  └─ Redis Sessions',
    techs: ['OAuth 2.0', 'JWT', 'Redis', 'FastAPI', 'PostgreSQL'],
    skills: ['OAuth PKCE flow', 'Token rotation', 'RBAC implementation', 'Session management']
  },
  {
    id: 3, slug: 'ticket-booking',
    title: 'Concurrent Ticket Booking System',
    difficulty: 'expert',
    hours: 8,
    chapter: 4,
    description: 'Build a ticket booking system that must handle concurrent purchases. You will intentionally create race conditions, observe their failure modes, then fix them with proper locking.',
    architecture: 'Client A + Client B (concurrent)\n  ↓\nFastAPI\n  └─ PostgreSQL\n       └─ SELECT FOR UPDATE\n            └─ Advisory Locks',
    techs: ['PostgreSQL', 'FastAPI', 'SQLAlchemy', 'Python'],
    skills: ['Row-level locking', 'Race condition detection', 'Idempotency', 'ACID transactions']
  },
  {
    id: 4, slug: 'rate-limiter',
    title: 'Distributed Redis Rate Limiter',
    difficulty: 'advanced',
    hours: 6,
    chapter: 9,
    description: 'Implement a production-grade distributed rate limiter using Redis sliding window algorithm with burst handling, retry headers, and visual request simulator.',
    architecture: 'Client\n  ↓\nFastAPI Middleware\n  └─ Redis (Sliding Window)\n       ├─ Accept (200)\n       └─ Reject (429)',
    techs: ['Redis', 'FastAPI', 'Lua Scripts', 'Python'],
    skills: ['Sliding window algorithm', 'Redis atomic ops', 'Lua scripting', 'HTTP rate headers']
  },
  {
    id: 5, slug: 'realtime-collab',
    title: 'Real-Time Collaboration Platform',
    difficulty: 'expert',
    hours: 10,
    chapter: 12,
    description: 'Build a real-time collaboration platform with WebSockets, rooms, online presence, typing indicators, and horizontal scaling via Redis Pub/Sub.',
    architecture: 'Client A ↔ WebSocket ↔ FastAPI\nClient B ↔ WebSocket → Redis Pub/Sub\n  └─ Broadcast to all connections',
    techs: ['WebSockets', 'Redis', 'FastAPI', 'ASGI', 'Python'],
    skills: ['WebSocket lifecycle', 'Connection management', 'Redis Pub/Sub', 'Horizontal scaling']
  },
  {
    id: 6, slug: 'celery-processor',
    title: 'Async Document Processing Platform',
    difficulty: 'advanced',
    hours: 8,
    chapter: 10,
    description: 'Build an async document processing pipeline that accepts file uploads, queues processing jobs, handles retries with exponential backoff, and notifies users on completion.',
    architecture: 'Client\n  ↓ Upload\nFastAPI\n  ↓ Enqueue\nRedis/RabbitMQ\n  ↓\nCelery Workers\n  └─ PostgreSQL + S3',
    techs: ['Celery', 'Redis', 'FastAPI', 'PostgreSQL', 'Docker'],
    skills: ['Task queues', 'Retry strategies', 'Dead-letter queues', 'Worker concurrency']
  },
  {
    id: 7, slug: 'observable-microservice',
    title: 'Fully Observable FastAPI Microservice',
    difficulty: 'expert',
    hours: 10,
    chapter: 16,
    description: 'Instrument a FastAPI service with Prometheus metrics, OpenTelemetry distributed tracing, structured JSON logging with correlation IDs, and a Grafana dashboard.',
    architecture: 'FastAPI\n  ├─ Prometheus (/metrics)\n  ├─ OpenTelemetry (OTLP)\n  ├─ Structured Logs (JSON)\n  └─ Grafana Dashboard',
    techs: ['Prometheus', 'Grafana', 'OpenTelemetry', 'FastAPI', 'Docker'],
    skills: ['Prometheus instrumentation', 'Distributed tracing', 'Structured logging', 'SLO dashboards']
  },
  {
    id: 8, slug: 'event-driven-orders',
    title: 'Event-Driven Order Processing System',
    difficulty: 'expert',
    hours: 12,
    chapter: 11,
    description: 'Build an event-driven order system with the outbox pattern, idempotent consumers, event replay, and proper exactly-once delivery semantics.',
    architecture: 'FastAPI\n  └─ Outbox (PostgreSQL)\n       └─ Event Publisher\n            └─ Redis Streams\n                 └─ Order/Payment/Notification Consumers',
    techs: ['Redis Streams', 'PostgreSQL', 'FastAPI', 'Celery', 'Python'],
    skills: ['Outbox pattern', 'Idempotent consumers', 'Event replay', 'Eventual consistency']
  },
  {
    id: 9, slug: 'k8s-deployment',
    title: 'Kubernetes FastAPI Deployment',
    difficulty: 'expert',
    hours: 10,
    chapter: 21,
    description: 'Deploy a complete FastAPI stack to Kubernetes with HPA, rolling deployments, canary releases, health probes, ConfigMaps, and Ingress.',
    architecture: 'Ingress (Nginx)\n  └─ FastAPI Deployment (HPA)\n       ├─ PostgreSQL StatefulSet\n       ├─ Redis StatefulSet\n       └─ Celery Workers (HPA)',
    techs: ['Kubernetes', 'Docker', 'Nginx', 'GitHub Actions', 'Helm'],
    skills: ['K8s fundamentals', 'HPA configuration', 'Rolling deployments', 'Health probes']
  },
  {
    id: 10, slug: 'ci-cd-pipeline',
    title: 'Complete CI/CD Pipeline',
    difficulty: 'expert',
    hours: 8,
    chapter: 19,
    description: 'Build a complete CI/CD pipeline with GitHub Actions and Jenkins: lint, type check, test, security scan, Docker build, push to registry, deploy to staging, smoke tests.',
    architecture: 'Git Push\n  └─ Lint + Type Check\n       └─ Unit + Integration Tests\n            └─ Security Scan (Trivy)\n                 └─ Docker Build + Push\n                      └─ Deploy + Smoke Tests',
    techs: ['GitHub Actions', 'Jenkins', 'Docker', 'Trivy', 'Python'],
    skills: ['Pipeline design', 'Test automation', 'Security scanning', 'Deployment automation']
  },
  {
    id: 11, slug: 'security-hardening',
    title: 'FastAPI Security Hardening Lab',
    difficulty: 'expert',
    hours: 8,
    chapter: 6,
    description: 'Start with an intentionally vulnerable FastAPI application. Identify and fix SQL injection, broken auth, SSRF, CORS misconfiguration, and insecure file uploads.',
    architecture: 'Vulnerable FastAPI App\n  └─ SQL Injection (fix)\n  └─ SSRF (fix)\n  └─ Broken Auth (fix)\n  └─ CORS (fix)\n  └─ File Upload (fix)',
    techs: ['FastAPI', 'PostgreSQL', 'OWASP', 'Argon2', 'Python'],
    skills: ['OWASP Top 10', 'SQL injection prevention', 'Security headers', 'Input validation']
  },
  {
    id: 12, slug: 'saas-capstone',
    title: 'Production SaaS Platform Capstone',
    difficulty: 'production',
    hours: 40,
    chapter: 25,
    description: 'The ultimate capstone: build a complete production SaaS platform with every concept from the course. Google OAuth, RBAC, PostgreSQL, Redis, Celery, WebSockets, Observability, Docker, CI/CD, and Kubernetes.',
    architecture: 'Browser\n  ↓\nNginx (TLS + Load Balancer)\n  ↓\nFastAPI (multiple replicas)\n  ├─ PostgreSQL (primary + replica)\n  ├─ Redis (cache + sessions + broker)\n  ├─ Celery Workers\n  ├─ WebSocket Server\n  └─ Prometheus + Grafana',
    techs: ['FastAPI', 'PostgreSQL', 'Redis', 'Celery', 'Docker', 'Kubernetes', 'Nginx', 'GitHub Actions'],
    skills: ['Full-stack backend', 'Production architecture', 'SRE practices', 'Distributed systems']
  },
];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-400 font-semibold text-sm mb-6 border border-orange-500/20">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            12 Production Projects
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Real Systems</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed font-light max-w-2xl mx-auto">
            Stop watching tutorials and start building. Apply what you learn immediately through 
            hands-on, production-grade engineering projects designed to challenge you.
          </p>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section className="container mx-auto px-6 max-w-7xl relative z-10">
        <ProjectsList initialProjects={projects} />
      </section>
    </main>
  );
}
