import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch18Lessons: Record<string, Lesson> = {
  'python-docker-fundamentals': {
    id: '18-01',
    slug: 'python-docker-fundamentals',
    chapterId: 18,
    order: 1,
    title: 'Python Docker Image Fundamentals',
    description: 'Learn to write efficient, cache-friendly Dockerfiles for FastAPI using slim base images.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.docker, technologies.python],
    prerequisites: ['17-04'],
    objectives: [
      'Choose between python:3.12-slim and distroless',
      'Order Dockerfile instructions for cache efficiency',
      'Use .dockerignore to exclude unnecessary files',
      'Measure image size and startup time'
    ],
    sections: [
      {
        id: 'docker-fundamentals-concept',
        type: 'concept',
        title: 'Choosing the Right Base Image',
        content: `When containerizing a FastAPI application, the first and most critical decision is selecting the base image. The standard \`python:3.12\` image is based on Debian and includes numerous build tools (like gcc, make) which you rarely need in a production container. It results in an image size close to 1GB.

Instead, \`python:3.12-slim\` is the industry standard for most Python applications. It strips away the compiler toolchain, leaving only the minimal runtime requirements. This reduces the image size to around 150MB, significantly decreasing attack surface, network transfer time, and startup latency.

For the most secure deployments, "distroless" images (like Google's \`gcr.io/distroless/python3\`) take this further by removing the OS shell (bash/sh), package managers, and coreutils. However, they complicate debugging since you cannot \`docker exec -it <container> sh\` into them, requiring robust centralized logging and telemetry.`,
      },
      {
        id: 'docker-fundamentals-implementation',
        type: 'implementation',
        title: 'Writing an Optimized Dockerfile',
        content: `A well-crafted Dockerfile leverages Docker's layer caching mechanism. Instructions are executed sequentially, and if a layer's dependencies haven't changed, Docker reuses the cached layer.

Because application code changes far more frequently than dependencies, we must copy \`requirements.txt\` (or \`pyproject.toml\`), install dependencies, and *then* copy the application code. This ensures that a simple code change doesn't trigger a full dependency re-installation.

Equally important is the \`.dockerignore\` file. Without it, \`COPY . .\` will include your virtual environment, \`__pycache__\` directories, and git history, bloating the image and potentially leaking sensitive local data.`,
        codeExample: {
          id: 'docker-fundamentals-code',
          title: 'Optimized FastAPI Dockerfile',
          files: {
            'Dockerfile': {
              language: 'dockerfile',
              code: `# Use the slim Python 3.12 image
FROM python:3.12-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing .pyc files
# PYTHONUNBUFFERED: Ensures Python output is logged immediately
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PORT=8000

# Set the working directory
WORKDIR /app

# Install system dependencies (if needed, e.g., for psycopg2)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev \\
#     && rm -rf /var/lib/apt/lists/*

# Copy ONLY the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir keeps the image small by not storing pip's download cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE \${PORT}

# Run the FastAPI application using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
            },
            '.dockerignore': {
              language: 'ignore',
              code: `# Virtual environments
venv/
.venv/
env/

# Python cache
__pycache__/
*.py[cod]
*$py.class

# Git repository
.git/
.gitignore

# Environment files
.env
.env.*

# Testing and coverage
.pytest_cache/
htmlcov/
.coverage
coverage.xml

# IDE and OS files
.vscode/
.idea/
.DS_Store`
            }
          }
        }
      },
      {
        id: 'docker-fundamentals-architecture',
        type: 'architecture',
        title: 'Layer Caching in Action',
        content: `When you build an image using the Dockerfile provided, Docker creates a separate filesystem layer for each \`RUN\`, \`COPY\`, and \`ADD\` instruction. 

If you modify \`app/main.py\` and rebuild, Docker sees that \`requirements.txt\` hasn't changed. It uses the cached layers for \`COPY requirements.txt .\` and \`RUN pip install...\`. It only creates new layers for \`COPY . .\` and everything below it. This reduces build times from minutes to seconds in your CI/CD pipeline and local development loop.`
      }
    ],
    challenges: [
      {
        id: 'docker-fundamentals-challenge',
        title: 'Optimize the Build Order',
        description: 'A developer wrote a Dockerfile with `COPY . .` *before* `RUN pip install -r requirements.txt`. Re-order the instructions to optimize for Docker layer caching.',
        hint: 'Dependencies change less frequently than application code.',
        solution: 'By copying the requirements file and installing dependencies first, Docker caches the expensive `pip install` step. Subsequent builds where only application code changes will skip dependency installation.',
        solutionCode: {
          id: 'docker-fundamentals-sol',
          language: 'dockerfile',
          title: 'Optimized Order',
          filename: 'Dockerfile',
          code: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'docker-fundamentals-iq1',
        question: 'Why should you set `PYTHONUNBUFFERED=1` in a Python Dockerfile?',
        answer: 'By default, Python buffers standard output. In a containerized environment like Docker or Kubernetes, this means log messages might not appear in the container logs immediately, leading to missed logs during crashes. `PYTHONUNBUFFERED=1` disables this buffering, ensuring realtime logging.',
        difficulty: 'intermediate'
      },
      {
        id: 'docker-fundamentals-iq2',
        question: 'Explain the difference between `python:3.12` and `python:3.12-slim`.',
        answer: '`python:3.12` is based on the full Debian OS and includes heavy build tools like GCC and Make. `python:3.12-slim` is stripped down, containing only minimal packages required to run Python. The slim image is significantly smaller (150MB vs 1GB+), reducing attack surface and image pull times.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'docker-fundamentals-pn1',
        severity: 'warning',
        content: 'Never include `.env` files containing actual secrets in your Docker image. Always add them to `.dockerignore`. Secrets should be injected at runtime via the container orchestrator (e.g., Kubernetes Secrets or Docker Compose environments).'
      }
    ],
    commonMistakes: [
      {
        id: 'docker-fundamentals-cm1',
        title: 'Missing pip --no-cache-dir',
        description: 'Forgetting to use `--no-cache-dir` leaves pip\'s downloaded tarballs in the Docker image, bloating the image size for no benefit.',
        badCode: {
          id: 'docker-fundamentals-bad1',
          language: 'dockerfile',
          title: 'Bloated Image',
          code: `RUN pip install -r requirements.txt`
        },
        goodCode: {
          id: 'docker-fundamentals-good1',
          language: 'dockerfile',
          title: 'Lean Image',
          code: `RUN pip install --no-cache-dir -r requirements.txt`
        }
      }
    ],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'multistage-builds': {
    id: '18-02',
    slug: 'multistage-builds',
    chapterId: 18,
    order: 2,
    title: 'Multi-Stage Docker Builds',
    description: 'Use multi-stage builds to compile C-extensions and produce ultra-lean final images.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.docker, technologies.python],
    prerequisites: ['18-01'],
    objectives: [
      'Use builder stage for dependency installation',
      'Copy only necessary artifacts to final stage',
      'Achieve images under 100MB for FastAPI',
      'Verify multi-stage build with dive tool'
    ],
    sections: [
      {
        id: 'multistage-concept',
        type: 'concept',
        title: 'The Problem with Build Dependencies',
        content: `Many Python packages (like \`psycopg2\` for PostgreSQL, \`cryptography\`, or machine learning libraries) contain C extensions that must be compiled during \`pip install\`. To compile them, your Docker image needs build tools like \`gcc\`, \`python3-dev\`, and various C libraries.

If you install these build tools in your final image, you drastically increase the image size and the attack surface area. If a vulnerability is found in \`gcc\`, your container is flagged by security scanners, even though you only needed \`gcc\` during the build phase.

Multi-stage builds solve this by allowing you to use multiple \`FROM\` statements in a single Dockerfile. You create a heavy "builder" stage to compile dependencies, and then copy *only* the compiled artifacts (the Python packages) into a clean, minimal "runtime" stage.`,
      },
      {
        id: 'multistage-implementation',
        type: 'implementation',
        title: 'Implementing a Python Multi-Stage Build',
        content: `In Python, the most robust way to transfer dependencies between stages is by building binary "wheels" (using \`pip wheel\`) in the builder stage, and then installing those pre-compiled wheels in the final stage. Alternatively, you can use Python virtual environments (\`venv\`), building it in the first stage and copying the entire \`/opt/venv\` directory to the final stage.

The \`venv\` approach is generally preferred for its simplicity. We create the venv, install everything into it using the builder's system compilers, and then copy that isolated directory to the clean runtime image, adding it to the \`PATH\`.`,
        codeExample: {
          id: 'multistage-code',
          title: 'Multi-stage Dockerfile with Venv',
          files: {
            'Dockerfile': {
              language: 'dockerfile',
              code: `# ==========================================
# Stage 1: Builder
# ==========================================
FROM python:3.12-slim as builder

# Install build dependencies (compilers, C libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv

# Make sure we use the venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

# Install dependencies into the venv
# The venv will contain all compiled C extensions
RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# Stage 2: Runtime (Final Image)
# ==========================================
FROM python:3.12-slim as runtime

# We only need runtime libraries (e.g., libpq5), NOT compilers (libpq-dev)
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpq5 \\
    && rm -rf /var/lib/apt/lists/*

# Copy the completely built venv from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Enable the venv by prepending its bin directory to PATH
ENV PATH="/opt/venv/bin:$PATH" \\
    PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy application code
COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
            }
          }
        }
      },
      {
        id: 'multistage-production',
        type: 'production',
        title: 'Verifying with Dive',
        content: `To ensure your multi-stage build actually reduced image size, you can use a tool called \`dive\` (\`wagoodman/dive\` on GitHub). \`dive\` lets you inspect Docker image layers interactively.

When inspecting the multi-stage image, you will notice that the layers associated with the \`builder\` stage (including the \`build-essential\` packages) do not exist in the final image history. You only pay the storage and transfer cost for the final \`runtime\` layers and the copied \`/opt/venv\` directory.`
      }
    ],
    challenges: [
      {
        id: 'multistage-challenge',
        title: 'Multi-Stage Wheel Build',
        description: 'Rewrite the multi-stage build to use `pip wheel` instead of a virtual environment. Build wheels in the first stage, and install those wheels in the final stage.',
        hint: 'Use `pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt` in the builder.',
        solution: 'Building wheels compiles everything into binary distributions. In the final stage, we copy the wheels directory and run pip install against it without reaching out to PyPI.',
        solutionCode: {
          id: 'multistage-sol',
          language: 'dockerfile',
          title: 'Wheel Approach',
          filename: 'Dockerfile',
          code: `FROM python:3.12-slim as builder
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y build-essential
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/src/app/wheels /wheels
RUN pip install --no-cache /wheels/*
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'multistage-iq1',
        question: 'What is the primary security benefit of using a multi-stage Docker build?',
        answer: 'Multi-stage builds allow you to keep build tools (like compilers, package managers, and source headers) out of the final production image. This significantly reduces the attack surface area, limiting the tools an attacker would have available if they managed to gain code execution inside the container.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'multistage-pn1',
        severity: 'critical',
        content: 'Ensure that runtime dependencies (like `libpq5` for Postgres) are still installed in the final stage, even if the build dependency (`libpq-dev`) was used in the builder stage. Compiled C-extensions dynamically link to these shared libraries at runtime.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'non-root-security': {
    id: '18-03',
    slug: 'non-root-security',
    chapterId: 18,
    order: 3,
    title: 'Non-Root Container Security',
    description: 'Secure your containers by running the FastAPI process as an unprivileged user.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.docker],
    prerequisites: ['18-02'],
    objectives: [
      'Create application user in Dockerfile',
      'Set file permissions for non-root user',
      'Configure Uvicorn to bind as non-root',
      'Scan containers for root process violations'
    ],
    sections: [
      {
        id: 'nonroot-concept',
        type: 'concept',
        title: 'The Danger of Root in Containers',
        content: `By default, processes inside a Docker container run as the \`root\` user. If an attacker discovers a Remote Code Execution (RCE) vulnerability in your FastAPI application or one of its dependencies, they execute code as \`root\` inside the container. 

While Docker provides isolation, running as root significantly increases the risk of a container breakout—where the attacker escapes the container and gains root access to the host machine or Kubernetes node.

Security standards (like CIS benchmarks or Kubernetes Pod Security Standards) strongly mandate that container workloads must NOT run as root. We must create a dedicated, unprivileged user and switch to that user at the end of the Dockerfile.`,
      },
      {
        id: 'nonroot-implementation',
        type: 'implementation',
        title: 'Implementing the Non-Root User',
        content: `Creating a non-root user involves using the \`groupadd\` and \`useradd\` Linux commands. Once created, you must ensure that this new user has ownership over the application directory and any directories it needs to write to (like log directories or temporary file mounts).

Finally, you use the \`USER\` directive in the Dockerfile. Every instruction following \`USER\` (including the final \`CMD\`) will be executed as that unprivileged user. Note that non-root users cannot bind to ports below 1024, which is why FastAPI runs on port 8000 by default instead of port 80 or 443.`,
        codeExample: {
          id: 'nonroot-code',
          title: 'Secure Non-Root Dockerfile',
          files: {
            'Dockerfile': {
              language: 'dockerfile',
              code: `FROM python:3.12-slim

# Create a specific user and group for the application
# We use ID 10001 to avoid conflicts with host user IDs
RUN groupadd -g 10001 fastapigroup && \\
    useradd -u 10001 -g fastapigroup -s /bin/bash -m fastapiuser

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Change ownership of the application directory to the new user
# This is required if the application needs to write files here,
# but for maximum security, the app dir should remain root-owned 
# and read-only to the app user, mounting a specific writeable tmp dir if needed.
RUN chown -R fastapiuser:fastapigroup /app

# Switch to the non-root user
USER fastapiuser

# Uvicorn binds to 8000 (a non-privileged port > 1024)
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
            }
          }
        }
      },
      {
        id: 'nonroot-production',
        type: 'production',
        title: 'Filesystem Permissions and Immutability',
        content: `In a strictly secured environment, you don't actually want the \`fastapiuser\` to own the \`/app\` directory. If the user owns the code directory, an attacker who exploits an RCE could overwrite your Python source files and change the behavior of the application.

Best practice dictates that root owns the \`/app\` directory (read-only for the \`fastapiuser\`). If the application needs to write temporary files, you should create a specific directory (e.g., \`/tmp/app\`), \`chown\` only that directory to the \`fastapiuser\`, or use Kubernetes \`emptyDir\` volumes mounted at runtime.`
      }
    ],
    challenges: [
      {
        id: 'nonroot-challenge',
        title: 'Fix Permission Denied Error',
        description: 'You switched to a non-root user, but now FastAPI crashes on startup with `PermissionError: [Errno 13] Permission denied: \'/app/logs/access.log\'`. Modify the Dockerfile concepts to fix this.',
        hint: 'The non-root user needs write access to the specific directory where logs are written.',
        solution: 'You need to create the logs directory as root, give ownership of that specific directory to the non-root user, and then switch users.',
        solutionCode: {
          id: 'nonroot-sol',
          language: 'dockerfile',
          title: 'Permission Fix',
          filename: 'Dockerfile',
          code: `RUN mkdir -p /app/logs && chown -R fastapiuser:fastapigroup /app/logs
USER fastapiuser`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'nonroot-iq1',
        question: 'Why does Uvicorn crash if you set it to `--port 80` while running as a non-root user?',
        answer: 'In Unix-like operating systems, ports below 1024 are considered "privileged" ports. Only processes running as the `root` user can bind to them. When running as a non-root user, you must bind to an unprivileged port, typically 8000 or 8080.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'nonroot-pn1',
        severity: 'critical',
        content: 'When deploying to Kubernetes, enforce non-root execution using the `securityContext` at the pod/container level: `runAsNonRoot: true` and `runAsUser: 10001`. This ensures the orchestration layer rejects the pod if the image attempts to run as root.'
      }
    ],
    commonMistakes: [
      {
        id: 'nonroot-cm1',
        title: 'Chown during COPY vs RUN',
        description: 'Using `RUN chown` creates an entirely new filesystem layer containing a duplicate of every file, doubling the image size.',
        badCode: {
          id: 'nonroot-bad1',
          language: 'dockerfile',
          title: 'Doubles Image Size',
          code: `COPY . /app
RUN chown -R fastapiuser:fastapigroup /app`
        },
        goodCode: {
          id: 'nonroot-good1',
          language: 'dockerfile',
          title: 'Efficient Copy',
          code: `COPY --chown=fastapiuser:fastapigroup . /app`
        }
      }
    ],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'docker-compose-stack': {
    id: '18-04',
    slug: 'docker-compose-stack',
    chapterId: 18,
    order: 4,
    title: 'Docker Compose Full Stack',
    description: 'Orchestrate FastAPI, PostgreSQL, and Redis together using Docker Compose for local development.',
    duration: 55,
    difficulty: 'advanced',
    technologies: [technologies.docker, technologies.fastapi, technologies.postgresql, technologies.redis],
    prerequisites: ['18-03'],
    objectives: [
      'Write docker-compose.yml for full stack',
      'Configure inter-service networking',
      'Set dependency ordering with depends_on',
      'Mount volumes for data persistence'
    ],
    sections: [
      {
        id: 'compose-concept',
        type: 'concept',
        title: 'Local Orchestration with Docker Compose',
        content: `While Dockerfiles define how to build a single container, modern applications are composed of multiple distributed services: the FastAPI backend, a PostgreSQL database, a Redis cache, and perhaps a Celery worker. Managing these individually via \`docker run\` commands is tedious and error-prone.

Docker Compose is a declarative tool that allows you to define your entire multi-container architecture in a single \`docker-compose.yml\` file. It automatically creates an isolated virtual network where services can communicate with each other using their service names as DNS hostnames (e.g., the FastAPI app can connect to Postgres at \`postgresql://user:pass@db:5432/db\`).`,
      },
      {
        id: 'compose-implementation',
        type: 'implementation',
        title: 'Defining the Stack',
        content: `A robust \`docker-compose.yml\` defines services, networks, and volumes. We use volume mounts to persist database data across container restarts. For the FastAPI service, we use a bind mount (\`./:/app\`) during local development so that code changes trigger Uvicorn's auto-reload without needing to rebuild the Docker image.

Notice the \`depends_on\` block. While it guarantees startup order, it only guarantees that the database container has *started*, not that PostgreSQL is ready to accept connections. We will refine this with healthchecks in the next lesson.`,
        codeExample: {
          id: 'compose-code',
          title: 'Full Stack Docker Compose',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'

services:
  api:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./:/app  # Live code reloading
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/appdb
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    # Override CMD to enable reload in development
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=appdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    # In development, editing this file will trigger an auto-reload
    # thanks to the docker-compose volume mount and --reload flag.
    return {"message": "Hello from Docker Compose!"}`
            }
          }
        }
      },
      {
        id: 'compose-architecture',
        type: 'architecture',
        title: 'Service Networking and DNS',
        content: `When you run \`docker compose up\`, Compose creates a bridge network (e.g., \`myapp_default\`). Every service attached to this network is reachable by other services using its YAML key as the hostname.

This is why \`DATABASE_URL\` points to \`@db:5432\` instead of \`@localhost:5432\`. From the perspective of the \`api\` container, \`localhost\` refers to the \`api\` container itself. The internal DNS resolver provided by Docker maps the hostname \`db\` to the internal IP address of the PostgreSQL container.`
      }
    ],
    challenges: [
      {
        id: 'compose-challenge',
        title: 'Add a Celery Worker',
        description: 'Expand the docker-compose.yml to include a Celery worker service. The worker should build from the same Dockerfile as the API, depend on Redis, and run the celery worker command.',
        hint: 'Define a new service, use `build: .`, and override the `command`.',
        solution: 'You can reuse the build context. The worker needs access to the same code and environment variables but executes a different command.',
        solutionCode: {
          id: 'compose-sol',
          language: 'yaml',
          title: 'Celery Service',
          filename: 'docker-compose.yml',
          code: `  worker:
    build: .
    volumes:
      - ./:/app
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
    command: celery -A app.worker.celery_app worker --loglevel=info`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'compose-iq1',
        question: 'In a Docker Compose network, why can\'t the FastAPI container connect to the database using `localhost:5432`?',
        answer: 'In Docker, every container has its own isolated network namespace. `localhost` inside the FastAPI container resolves to the FastAPI container itself. To communicate across containers, they must use Docker\'s embedded DNS resolver, which maps the service names (e.g., `db`) to their respective container IPs on the shared bridge network.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'compose-pn1',
        severity: 'warning',
        content: 'Avoid mapping database ports (e.g., `5432:5432`) to the host in production environments. Only map ports that need to be publicly accessible. In local development, it\'s acceptable so you can use tools like DBeaver or DataGrip.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'health-checks': {
    id: '18-05',
    slug: 'health-checks',
    chapterId: 18,
    order: 5,
    title: 'Container Health Checks',
    description: 'Ensure reliable startup ordering and self-healing systems using Docker Healthchecks.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.docker, technologies.fastapi],
    prerequisites: ['18-04'],
    objectives: [
      'Write Dockerfile HEALTHCHECK instructions',
      'Configure health checks in docker-compose',
      'Use depends_on condition: service_healthy',
      'Monitor container health status'
    ],
    sections: [
      {
        id: 'health-concept',
        type: 'concept',
        title: 'The Database Connection Race Condition',
        content: `A classic problem in microservices orchestration is startup timing. If your FastAPI application starts and immediately attempts to connect to PostgreSQL, it will likely crash with a \`Connection refused\` error. Even if PostgreSQL's container has started running, the database engine inside it takes a few seconds to initialize its files, allocate memory, and begin accepting TCP connections.

While standard \`depends_on\` ensures container start order, it doesn't solve this because it considers a container "started" the millisecond the main process launches.

To solve this, we use Healthchecks. A Healthcheck is a command periodically executed inside the container to determine if the application is actually ready to serve traffic. We can then modify \`depends_on\` to wait until the dependency is marked as \`healthy\`.`,
      },
      {
        id: 'health-implementation',
        type: 'implementation',
        title: 'Implementing Healthchecks in Compose',
        content: `We implement healthchecks using the native tools available in the containers. For PostgreSQL, we use \`pg_isready\`. For Redis, we use \`redis-cli ping\`. For our FastAPI application, we can use \`curl\` (if installed) or a lightweight Python script to ping a \`/health\` endpoint.

Once the healthchecks are defined, we update the FastAPI service's \`depends_on\` configuration to wait for the \`service_healthy\` condition. This guarantees that FastAPI won't even attempt to start until the database is fully ready to accept queries.`,
        codeExample: {
          id: 'health-code',
          title: 'Healthchecks in Compose',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/appdb
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    # API Healthcheck using internal python to avoid installing curl
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=appdb
    healthcheck:
      # Native PG utility to check if accepting connections
      test: ["CMD-SHELL", "pg_isready -U postgres -d appdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5`
            },
            'app/main.py': {
              language: 'python',
              code: `from fastapi import FastAPI
from sqlalchemy import text
from app.database import async_session

app = FastAPI()

@app.get("/health")
async def health_check():
    """
    Endpoint for Docker/K8s to verify the app is alive.
    In a real app, you might also ping the DB here to ensure full system health.
    """
    return {"status": "healthy"}`
            }
          }
        }
      },
      {
        id: 'health-production',
        type: 'production',
        title: 'Deep vs. Shallow Healthchecks',
        content: `A "shallow" healthcheck simply confirms the HTTP server is responding (e.g., returning 200 OK). A "deep" healthcheck goes further, attempting a simple database query and Redis ping to ensure all downstream dependencies are functional.

In Docker Compose, shallow checks on the API are usually sufficient since \`depends_on\` handles dependency health. However, in Kubernetes (which doesn't support strict startup ordering out-of-the-box), your API's Liveness/Readiness probes often need to perform deep checks and gracefully handle transient database unavailability.`
      }
    ],
    challenges: [
      {
        id: 'health-challenge',
        title: 'Handling Missing curl',
        description: 'You are using `python:3.12-slim` which does not have `curl` installed. Write a HEALTHCHECK command that checks the `http://localhost:8000/health` endpoint without using `curl` or installing new packages.',
        hint: 'Use Python\'s built-in `urllib` module via a one-liner command.',
        solution: 'You can execute Python with the `-c` flag to run a small inline script that makes an HTTP request.',
        solutionCode: {
          id: 'health-sol',
          language: 'dockerfile',
          title: 'Python Healthcheck',
          filename: 'Dockerfile',
          code: `HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'health-iq1',
        question: 'Why is `depends_on` alone insufficient for ensuring a database is ready before the API starts?',
        answer: '`depends_on` only tracks the container lifecycle state. It guarantees that the database container has been created and the entrypoint process has started. However, complex applications like PostgreSQL take several seconds to initialize internally before they open TCP ports and accept connections. Healthchecks are required to verify the application inside the container is actually ready.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'health-pn1',
        severity: 'warning',
        content: 'While Docker Swarm uses HEALTHCHECK instructions for self-healing (restarting unhealthy containers), Kubernetes completely ignores Dockerfile HEALTHCHECK instructions, relying entirely on its own Liveness and Readiness probes defined in the YAML manifests.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'environment-secrets': {
    id: '18-06',
    slug: 'environment-secrets',
    chapterId: 18,
    order: 6,
    title: 'Environment Variables & Docker Secrets',
    description: 'Manage configurations safely and prevent secret leakage in containerized environments.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.docker],
    prerequisites: ['18-04'],
    objectives: [
      'Use .env files with Docker Compose',
      'Avoid printing secrets in container logs',
      'Use Docker Swarm/Compose secrets for production',
      'Pass build-time variables safely'
    ],
    sections: [
      {
        id: 'secrets-concept',
        type: 'concept',
        title: 'The Hierarchy of Configuration',
        content: `Managing configuration (like database URLs, API keys, and debug flags) across multiple environments (local, staging, production) is a cornerstone of the Twelve-Factor App methodology. Hardcoding these values in source code or Dockerfiles is a critical security vulnerability.

Docker provides multiple mechanisms for injecting configuration. The most common is Environment Variables. In Docker Compose, you can define these inline, or load them from a \`.env\` file. 

However, environment variables are easily exposed. If a process crashes, frameworks often print environment variables in the stack trace. Anyone who can run \`docker inspect <container>\` can read them in plaintext. For high-security environments, we use Docker Secrets or external secret managers (like AWS Secrets Manager or HashiCorp Vault).`,
      },
      {
        id: 'secrets-implementation',
        type: 'implementation',
        title: 'Implementing Docker Secrets',
        content: `Docker Secrets provide a mechanism where sensitive data is mounted as temporary, in-memory files (tmpfs) inside the container, typically at \`/run/secrets/<secret_name>\`. This means the secrets never touch the disk and are never exposed in environment variable dumps.

To support this in FastAPI, we use Pydantic's BaseSettings, which natively supports reading configurations from file paths. We configure Pydantic to read standard environment variables, but if it finds a specific secret file, it uses that instead.`,
        codeExample: {
          id: 'secrets-code',
          title: 'Docker Secrets with Pydantic',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    secrets:
      - db_password
      - api_key
    environment:
      # We tell our app where to find the secrets
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt`
            },
            'app/config.py': {
              language: 'python',
              code: `from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    db_user: str = "postgres"
    db_password: str = ""
    api_key: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Helper to read from Docker secrets if the *_FILE env var is set
        self.db_password = self._read_secret("DB_PASSWORD_FILE", self.db_password)
        self.api_key = self._read_secret("API_KEY_FILE", self.api_key)

    def _read_secret(self, env_var_name: str, default: str) -> str:
        import os
        secret_file = os.environ.get(env_var_name)
        if secret_file and Path(secret_file).exists():
            return Path(secret_file).read_text().strip()
        return default

settings = Settings()`
            }
          }
        }
      },
      {
        id: 'secrets-architecture',
        type: 'architecture',
        title: 'Build Secrets vs. Runtime Secrets',
        content: `It is critical to distinguish between runtime secrets (database passwords needed when the app runs) and build secrets (like a GitHub Personal Access Token needed to \`pip install\` a private repository during \`docker build\`).

Never pass build secrets using \`ENV\` or \`ARG\` in a Dockerfile. If you do, that secret becomes permanently embedded in the Docker image layers, and anyone who pulls the image can extract the token using \`docker history\`.

Instead, use Docker BuildKit's \`--mount=type=secret\` instruction. This temporarily mounts the secret during the \`RUN pip install\` step and removes it instantly, ensuring it never enters the image layer history.`
      }
    ],
    challenges: [
      {
        id: 'secrets-challenge',
        title: 'Secure pip install',
        description: 'You need to install a private python package from GitHub during build. Use BuildKit secrets to pass the `GITHUB_TOKEN` to pip without baking it into the image.',
        hint: 'Use `RUN --mount=type=secret,id=github_token ...` and read it directly in the command.',
        solution: 'By using the secret mount, the file `/run/secrets/github_token` is available only during the execution of that specific RUN command.',
        solutionCode: {
          id: 'secrets-sol',
          language: 'dockerfile',
          title: 'BuildKit Secrets',
          filename: 'Dockerfile',
          code: `# syntax=docker/dockerfile:1.2
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
# Expose the secret to this RUN command
RUN --mount=type=secret,id=github_token \\
    export GITHUB_TOKEN=$(cat /run/secrets/github_token) && \\
    pip install git+https://\${GITHUB_TOKEN}@github.com/myorg/private-repo.git -r requirements.txt`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'secrets-iq1',
        question: 'Why are Docker arguments (`ARG`) unsafe for passing sensitive information like API tokens during an image build?',
        answer: 'Values passed via `ARG` and used in a Dockerfile are stored in the image metadata. Even if you unset the variable or delete the layer later in the Dockerfile, the `ARG` value remains permanently visible to anyone who runs `docker history <image>` or inspects the image manifest.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'secrets-pn1',
        severity: 'critical',
        content: 'When writing application logs, rigorously ensure that Pydantic Settings objects or raw environment variables are never dumped to the logger, especially during unhandled exception tracebacks.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [
      {
        id: 'secrets-rw1',
        scenario: 'Leaked Database Credentials in Image',
        problem: 'A developer passed the database URL as an `ARG` in the Dockerfile so they could run a database migration script during the Docker build process. The image was pushed to a public registry, leaking the production database password via `docker history`.',
        solution: 'Never run stateful migrations during `docker build`. Migrations should be run as an init container or pre-flight job during deployment runtime. Pass credentials strictly as runtime environment variables or secrets.'
      }
    ],
    codeExamples: [],
  },

  'volume-data-management': {
    id: '18-07',
    slug: 'volume-data-management',
    chapterId: 18,
    order: 7,
    title: 'Volume & Data Management',
    description: 'Ensure stateful data survives container restarts and upgrades.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.docker, technologies.postgresql],
    prerequisites: ['18-04'],
    objectives: [
      'Use named volumes for database data',
      'Configure bind mounts for development',
      'Back up Docker volumes',
      'Handle volume migration during upgrades'
    ],
    sections: [
      {
        id: 'volume-concept',
        type: 'concept',
        title: 'Ephemeral Containers vs. Stateful Data',
        content: `By design, Docker containers are ephemeral. Any files written to the container's internal filesystem (the copy-on-write layer) are permanently destroyed when the container is removed or recreated. 

While this is perfect for stateless FastAPI applications, it is catastrophic for stateful services like PostgreSQL. If you run a database container without a volume, tearing down the stack (\`docker compose down\`) deletes all your application data.

To solve this, Docker provides Volumes. Volumes are storage mechanisms completely managed by the Docker engine, existing outside the lifecycle of any specific container.`,
      },
      {
        id: 'volume-implementation',
        type: 'implementation',
        title: 'Named Volumes vs. Bind Mounts',
        content: `There are two primary types of mounts in Docker:

1. **Bind Mounts**: Maps a specific file or directory on your host machine (e.g., \`./src\`) into the container. These are heavily used in local development to sync source code, enabling FastAPI's \`--reload\` flag to work.
2. **Named Volumes**: Docker manages the physical location on the host disk. These are optimized for I/O performance and are the absolute standard for database data (\`/var/lib/postgresql/data\`).

In Docker Compose, named volumes must be explicitly declared in the top-level \`volumes:\` block.`,
        codeExample: {
          id: 'volume-code',
          title: 'Volume Configurations',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'

services:
  api:
    build: .
    volumes:
      # Bind mount: Maps local host directory to /app in container
      # Allows live-reload during development
      - ./:/app:ro  # :ro means read-only, preventing container from modifying host files
      
      # Anonymous volume: Hides the local node_modules equivalent for Python
      # Prevents host venv from overriding container venv
      - /app/.venv
      
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      # Named volume: Persists database data across restarts
      - pg_data:/var/lib/postgresql/data
      
      # Bind mount for initialization scripts
      # Files here are automatically run when the DB initializes
      - ./init-scripts:/docker-entrypoint-initdb.d:ro

# Declare named volumes here
volumes:
  pg_data:`
            }
          }
        }
      },
      {
        id: 'volume-architecture',
        type: 'architecture',
        title: 'Backing Up Named Volumes',
        content: `Because named volumes are managed by Docker (stored deep in \`/var/lib/docker/volumes\` on Linux), accessing the files directly from the host is discouraged and sometimes impossible (like on Docker Desktop for Mac/Windows).

The standard way to backup a named volume is to run a temporary container that mounts both the named volume and a bind-mounted host directory, then uses \`tar\` to archive the data.`
      }
    ],
    challenges: [
      {
        id: 'volume-challenge',
        title: 'Backup Script',
        description: 'Write a one-line Docker command using `ubuntu` image that mounts a named volume called `myapp_pg_data` and archives its contents into a `backup.tar` file in your current host directory.',
        hint: 'Use `docker run --rm -v myapp_pg_data:/volume -v $(pwd):/backup ubuntu tar cvf /backup/backup.tar /volume`',
        solution: 'The temporary ubuntu container mounts the Docker-managed volume to `/volume` and your host directory to `/backup`. It runs `tar` to compress the data from `/volume` and saves it into `/backup`, which syncs back to your host machine.',
        solutionCode: {
          id: 'volume-sol',
          language: 'bash',
          title: 'Backup Command',
          filename: 'backup.sh',
          code: `docker run --rm \\
  -v myapp_pg_data:/volume \\
  -v $(pwd):/backup \\
  ubuntu tar cvf /backup/db_backup.tar /volume`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'volume-iq1',
        question: 'What is the difference between a bind mount and a named volume?',
        answer: 'A bind mount maps a specific, user-defined path on the host system to a path inside the container. It depends on the host\'s directory structure. A named volume is completely managed by Docker, stored in Docker\'s internal storage area. Named volumes are easier to back up, migrate, and perform better on non-Linux hosts.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'volume-pn1',
        severity: 'critical',
        content: 'When tearing down environments, `docker compose down` leaves named volumes intact. If you want to wipe the database and start fresh, you must explicitly use `docker compose down -v` to destroy the volumes.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'nginx-reverse-proxy': {
    id: '18-08',
    slug: 'nginx-reverse-proxy',
    chapterId: 18,
    order: 8,
    title: 'Nginx Reverse Proxy in Docker',
    description: 'Place Nginx in front of FastAPI to handle TLS, static files, and connection buffering.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.nginx, technologies.docker, technologies.fastapi],
    prerequisites: ['18-04'],
    objectives: [
      'Configure Nginx upstream for FastAPI',
      'Add TLS with self-signed cert in development',
      'Configure WebSocket proxying in Nginx',
      'Serve static files through Nginx'
    ],
    sections: [
      {
        id: 'nginx-concept',
        type: 'concept',
        title: 'Why Use a Reverse Proxy?',
        content: `While Uvicorn (the ASGI server running FastAPI) is highly performant for processing Python asynchronous code, it is not designed to be exposed directly to the public internet. It lacks robust safeguards against slow-client attacks (Slowloris), doesn't efficiently serve static files, and handling TLS/SSL certificates in Python is cumbersome.

A Reverse Proxy like Nginx is placed between the public internet and Uvicorn. Nginx handles SSL termination, rapidly buffers requests from slow clients (freeing up Uvicorn to process data instantly), rate-limits malicious traffic, and serves static assets (like React frontends or uploaded media) directly from disk with extreme efficiency.`,
      },
      {
        id: 'nginx-implementation',
        type: 'implementation',
        title: 'Configuring Nginx for FastAPI',
        content: `In a Docker Compose stack, Nginx runs in its own container and routes traffic to the FastAPI container using Docker's internal DNS. Nginx exposes port 80/443 to the host, while the FastAPI container is completely shielded—it exposes port 8000 *only* to the Docker network, not the host machine.

Crucially, Nginx must be configured to pass the correct headers (like \`X-Forwarded-For\` and \`X-Forwarded-Proto\`). Without these, FastAPI will think every request is coming from the Nginx internal IP via HTTP, which breaks things like OAuth2 redirects and rate-limiting middleware that rely on the client's actual IP address.`,
        codeExample: {
          id: 'nginx-code',
          title: 'Nginx + FastAPI Compose Stack',
          files: {
            'docker-compose.yml': {
              language: 'yaml',
              code: `version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api

  api:
    build: .
    # Note: No 'ports' mapped to host. Fully shielded behind Nginx.
    expose:
      - "8000"
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers`
            },
            'nginx.conf': {
              language: 'nginx',
              code: `events {
    worker_connections 1024;
}

http {
    upstream fastapi_backend {
        # 'api' matches the service name in docker-compose.yml
        server api:8000;
    }

    server {
        listen 80;
        server_name _;

        # Route all API traffic to Uvicorn
        location / {
            proxy_pass http://fastapi_backend;
            
            # Pass original client headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support headers
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Increase timeout for long-running endpoints
            proxy_read_timeout 60s;
        }

        # Optional: Serve static files directly via Nginx
        # location /static/ {
        #     alias /var/www/static/;
        # }
    }
}`
            }
          }
        }
      },
      {
        id: 'nginx-architecture',
        type: 'architecture',
        title: 'Proxy Headers and Security',
        content: `Notice the \`--proxy-headers\` flag on the Uvicorn command. When this is set, Uvicorn trusts the \`X-Forwarded-*\` headers sent by Nginx and updates the ASGI \`scope\` accordingly. 

If you use \`request.client.host\` inside a FastAPI route to get the user's IP, Uvicorn will read the \`X-Forwarded-For\` header injected by Nginx rather than the internal IP of the Nginx container itself.`
      }
    ],
    challenges: [
      {
        id: 'nginx-challenge',
        title: 'Support WebSockets',
        description: 'WebSockets require a persistent, upgraded HTTP connection. Ensure your Nginx configuration correctly proxies WebSocket requests to FastAPI.',
        hint: 'You need to set the `Upgrade` and `Connection` headers dynamically based on the incoming request.',
        solution: 'Standard proxy_pass closes connections quickly. WebSockets require telling Nginx to "Upgrade" the protocol from HTTP to WebSocket.',
        solutionCode: {
          id: 'nginx-sol',
          language: 'nginx',
          title: 'WebSocket Headers',
          filename: 'nginx.conf',
          code: `location /ws/ {
    proxy_pass http://fastapi_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'nginx-iq1',
        question: 'Why should Nginx serve static files instead of FastAPI/Uvicorn?',
        answer: 'Nginx is written in highly optimized C and uses kernel-level system calls (like `sendfile`) to transfer static assets directly from disk to the network socket, entirely bypassing application space. Uvicorn, being Python-based, consumes CPU and memory handling these bytes, stealing resources away from processing dynamic business logic.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'nginx-pn1',
        severity: 'critical',
        content: 'If running on a cloud provider (AWS/GCP), you often do not need an Nginx container. Managed Load Balancers (like AWS ALB) handle TLS termination, buffering, and header injection for you, routing traffic directly to your Uvicorn containers.'
      }
    ],
    commonMistakes: [
      {
        id: 'nginx-cm1',
        title: 'Missing Proxy Headers',
        description: 'Failing to pass proxy headers results in FastAPI logging the internal Docker IP (e.g., 172.18.0.x) for every request, breaking analytics and IP-based rate limiting.',
        badCode: {
          id: 'nginx-bad1',
          language: 'nginx',
          title: 'Incomplete Proxy',
          code: `location / {
    proxy_pass http://api:8000;
}`
        },
        goodCode: {
          id: 'nginx-good1',
          language: 'nginx',
          title: 'Correct Proxy Headers',
          code: `location / {
    proxy_pass http://api:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`
        }
      }
    ],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'container-optimization': {
    id: '18-09',
    slug: 'container-optimization',
    chapterId: 18,
    order: 9,
    title: 'Container Startup & Performance Optimization',
    description: 'Squeeze maximum performance out of your FastAPI containers for rapid auto-scaling.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.docker],
    prerequisites: ['18-01'],
    objectives: [
      'Minimize container startup time',
      'Reduce memory footprint with slim images',
      'Optimize layer caching in CI',
      'Use BuildKit for faster builds'
    ],
    sections: [
      {
        id: 'optimization-concept',
        type: 'concept',
        title: 'The Need for Speed in Auto-scaling',
        content: `In serverless environments (like AWS Fargate or Google Cloud Run) or Kubernetes clusters utilizing Horizontal Pod Autoscaling (HPA), the time it takes for a new container to begin serving traffic is critical. If there is a sudden spike in traffic, a 30-second startup delay means dropped requests and degraded user experience.

Startup time is primarily dictated by two factors:
1. **Image Pull Time:** The time it takes the node to download the Docker image over the network.
2. **Application Init Time:** The time Uvicorn, FastAPI, and SQLAlchemy take to import files, connect to databases, and bind the port.

Optimizing containers requires aggressively shrinking the image size to reduce pull times, and avoiding blocking operations during startup.`,
      },
      {
        id: 'optimization-implementation',
        type: 'implementation',
        title: 'Pre-compiling Python Bytecode',
        content: `Normally, Python compiles \`.py\` files into bytecode (\`.pyc\` files) at runtime when they are first imported. In a containerized environment where files are read-only and memory is tight, this on-the-fly compilation adds overhead during startup.

While we often set \`PYTHONDONTWRITEBYTECODE=1\` to prevent scattered \`.pyc\` files, for heavily optimized production images, we can explicitly pre-compile the bytecode during the Docker build process and use it at runtime. This can shave hundreds of milliseconds off Uvicorn's startup time.`,
        codeExample: {
          id: 'optimization-code',
          title: 'Bytecode Pre-compilation',
          files: {
            'Dockerfile': {
              language: 'dockerfile',
              code: `FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Pre-compile Python bytecode during build
# This compiles all .py files in /app into optimized .pyc files
RUN python -m compileall -b /app

# Remove original .py files to save space (optional, advanced!)
# RUN find /app -name "*.py" -delete

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
            }
          }
        }
      },
      {
        id: 'optimization-architecture',
        type: 'architecture',
        title: 'Gunicorn vs. Uvicorn in Containers',
        content: `For production, running naked \`uvicorn\` means your container processes exactly one thread of execution (one worker). If you allocate 1 CPU to the container, this is perfectly fine.

However, if you allocate 2 or 4 CPUs to the container, running a single Uvicorn worker wastes compute. You must wrap Uvicorn with a process manager. We use Gunicorn with the Uvicorn worker class. Gunicorn acts as a master process that forks multiple Uvicorn workers, maximizing CPU utilization on multi-core containers.`
      }
    ],
    challenges: [
      {
        id: 'optimization-challenge',
        title: 'Configure Gunicorn',
        description: 'Update the Dockerfile CMD to use Gunicorn as a process manager with Uvicorn workers. Configure it to run 4 workers.',
        hint: 'Use `gunicorn` with the `-w` flag and the `-k uvicorn.workers.UvicornWorker` flag.',
        solution: 'Gunicorn handles process management (restarting dead workers) while Uvicorn handles the ASGI asynchronous event loop.',
        solutionCode: {
          id: 'optimization-sol',
          language: 'dockerfile',
          title: 'Gunicorn CMD',
          filename: 'Dockerfile',
          code: `CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'optimization-iq1',
        question: 'Why should you generally restrict a container to a single CPU core and run one Uvicorn worker, rather than using multi-core containers with Gunicorn workers?',
        answer: 'In Kubernetes or modern orchestrators, it is often better to scale horizontally by deploying multiple 1-CPU containers (Pods) rather than vertically scaling one container with multiple Gunicorn workers. Horizontal scaling relies on the platform\'s load balancer, providing better fault tolerance, simpler resource requests, and more granular auto-scaling.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'optimization-pn1',
        severity: 'warning',
        content: 'When using Gunicorn in Docker, do not use daemon mode (`-D`). The master process must run in the foreground. If the foreground process exits, Docker assumes the container has crashed.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [],
    codeExamples: [],
  },

  'docker-ci-integration': {
    id: '18-10',
    slug: 'docker-ci-integration',
    chapterId: 18,
    order: 10,
    title: 'Docker in CI/CD Pipeline',
    description: 'Automate building, testing, and publishing Docker images using GitHub Actions.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.docker, technologies.github_actions],
    prerequisites: ['18-09'],
    objectives: [
      'Build and test Docker images in GitHub Actions',
      'Push images to GitHub Container Registry',
      'Use build cache in CI for speed',
      'Implement multi-platform builds (amd64, arm64)'
    ],
    sections: [
      {
        id: 'ci-concept',
        type: 'concept',
        title: 'The Containerized Delivery Pipeline',
        content: `Once your Dockerfile is optimized, the process of building and deploying it must be automated. A CI/CD pipeline ensures that every commit to the \`main\` branch results in a new, immutable Docker image tagged with a unique version (usually the Git SHA) and pushed to a secure registry.

A common pitfall in CI/CD is build times. Because CI runners spin up fresh environments, Docker's local layer cache is empty. Building a large Python project from scratch every time takes minutes. We solve this by configuring GitHub Actions to use an external build cache, pushing cached layers back to the registry alongside the image.`,
      },
      {
        id: 'ci-implementation',
        type: 'implementation',
        title: 'GitHub Actions Docker Build',
        content: `GitHub provides official actions (\`docker/build-push-action\`) that handle the complexities of BuildKit, multi-platform builds, and caching. 

In this pipeline, we authenticate with the GitHub Container Registry (GHCR), generate metadata (tags and labels), and build the image. We use the \`gha\` cache type, which utilizes GitHub's native Actions cache API to store Docker layers, making subsequent builds lightning fast.`,
        codeExample: {
          id: 'ci-code',
          title: 'GitHub Actions Pipeline',
          files: {
            '.github/workflows/docker-build.yml': {
              language: 'yaml',
              code: `name: Build and Publish Container

on:
  push:
    branches: [ "main" ]
  # Trigger on version tags
  push:
    tags: [ 'v*.*.*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to the Container registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=sha,format=long
            type=semver,pattern={{version}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          # Enable GitHub Actions cache integration for layer caching
          cache-from: type=gha
          cache-to: type=gha,mode=max
          # Optional: Build for both Intel and Apple Silicon/AWS Graviton
          # platforms: linux/amd64,linux/arm64`
            }
          }
        }
      },
      {
        id: 'ci-architecture',
        type: 'architecture',
        title: 'Multi-Platform Builds (ARM64)',
        content: `Historically, Docker images were built for x86_64 architectures (Intel/AMD). However, with the rise of Apple Silicon (M-series Macs) for local development and AWS Graviton processors for cost-effective cloud hosting, building ARM64 images is critical.

Docker Buildx leverages QEMU emulation to compile ARM64 images on standard x86 GitHub Actions runners. By specifying \`platforms: linux/amd64,linux/arm64\`, the pipeline produces a multi-arch manifest. When a user runs \`docker pull\`, Docker automatically downloads the architecture matching their host machine.`
      }
    ],
    challenges: [
      {
        id: 'ci-challenge',
        title: 'Testing Before Pushing',
        description: 'Modify the CI pipeline logic (conceptually) so that the image is built, tests are run INSIDE the built container, and it is only pushed to the registry if tests pass.',
        hint: 'You cannot use `push: true` immediately. You must build and export the image, run tests, and then push.',
        solution: 'You would set `push: false` and `load: true` on the build action to load the image into the local Docker daemon. Then add a step `run: docker run image-name pytest`. If successful, use a secondary push step or run `docker push`.',
        solutionCode: {
          id: 'ci-sol',
          language: 'yaml',
          title: 'Test then Push',
          filename: 'workflow.yml',
          code: `- name: Build and Load
  uses: docker/build-push-action@v5
  with:
    context: .
    load: true
    tags: my-app:test

- name: Run Tests
  run: docker run my-app:test pytest

- name: Push Image
  run: docker push ghcr.io/myorg/my-app:latest`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'ci-iq1',
        question: 'Why is it a bad practice to only tag Docker images with `:latest` in a CI/CD pipeline?',
        answer: '`:latest` is a mutable tag that constantly overwrites the previous version. If a deployment fails, rolling back is difficult because you don\'t know exactly which commit corresponds to the current `:latest`. Images should always be tagged immutably with the Git SHA or a Semantic Version number, allowing for deterministic deployments and instant rollbacks.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'ci-pn1',
        severity: 'info',
        content: 'When compiling C-extensions for ARM64 using QEMU emulation on an x86 CI runner, the build process can be extremely slow. For large projects, consider using native ARM64 GitHub Action runners to speed up the multi-platform build.'
      }
    ],
    commonMistakes: [],
    realWorldScenarios: [],
    codeExamples: [],
  }
};
