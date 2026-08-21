import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch19Lessons: Record<string, Lesson> = {
  'cicd-concepts': {
    id: '19-01',
    slug: 'cicd-concepts',
    chapterId: 19,
    order: 1,
    title: 'CI/CD Concepts & Pipeline Design',
    description: 'Understand the core concepts of Continuous Integration, Continuous Delivery, and Continuous Deployment for robust API releases.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.github_actions],
    prerequisites: [],
    objectives: [
      'Distinguish CI vs CD vs continuous deployment',
      'Design a pipeline that matches your release process',
      'Identify pipeline bottlenecks',
      'Measure pipeline performance (cycle time)'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The CI/CD Mindset',
        content: `Continuous Integration (CI) and Continuous Delivery/Deployment (CD) represent a cultural and technical shift towards releasing software frequently and reliably. CI focuses on integrating code into a shared repository several times a day, where each commit is verified by an automated build and test sequence.

Continuous Delivery ensures that the codebase is always in a deployable state, meaning you can release to production at any time by pressing a button. Continuous Deployment takes this one step further by automatically deploying every change that passes all automated tests to production without human intervention.

Designing a robust pipeline requires careful planning. A good pipeline should provide rapid feedback to developers (fail fast), build artifacts only once, and promote those identical artifacts through all environments to ensure consistency.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Pipeline Design Principles',
        content: `A well-architected pipeline follows a logical progression of stages, typically categorized into Build, Test, Security, and Deploy. Each stage acts as a gatekeeper, preventing faulty code from progressing further.

**1. Fail Fast:** Run the fastest checks (linting, type checking, unit tests) first. There's no point running a 30-minute integration test suite if the code doesn't even compile or fails a basic linter check.

**2. Build Once, Deploy Many:** Never rebuild your Docker image or application artifact for different environments. Build it once, tag it with a unique identifier (like the Git commit SHA), and promote that exact same artifact from Staging to Production. Configuration should be injected at runtime, not build time.

**3. Idempotency:** Deployments should be idempotent. Running the deployment pipeline multiple times with the same artifact should result in the same system state without causing errors.`
      },
      {
        id: 'production',
        type: 'production',
        title: 'Identifying Bottlenecks',
        content: `As teams grow, CI/CD pipelines often become a bottleneck. Long feedback loops frustrate developers and reduce velocity. Identifying these bottlenecks requires analyzing pipeline performance metrics.

Common bottlenecks include sequential test execution (instead of parallel), downloading dependencies repeatedly (lack of caching), and building large monolithic artifacts. To resolve these, introduce dependency caching, matrix test execution across multiple runners, and Docker layer caching. Measuring "Cycle Time" (the time from first commit to production deployment) helps track the effectiveness of these optimizations.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the difference between Continuous Delivery and Continuous Deployment?',
        answer: 'Continuous Delivery means the software is always in a deployable state, but deploying to production requires a manual approval or action. Continuous Deployment automatically deploys every change that passes the automated tests to production without any human intervention.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-2',
        question: 'Why is the "Build Once, Deploy Many" principle critical in CI/CD?',
        answer: 'Building once ensures that the exact artifact tested in staging is the one deployed to production. If you rebuild for production, variations in base images, dependencies, or build environments might introduce bugs that weren\'t caught in earlier stages.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never bake environment-specific configuration (like database passwords or API keys) into your build artifacts. Inject them at runtime using environment variables or secret managers.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The "Works on My Machine" Deployment Failure',
        problem: 'A team deployed an application by rebuilding the Docker image in the production pipeline. The deployment failed because a dependency released a new version between the staging build and the production build.',
        solution: 'They refactored the pipeline to build the Docker image once in the CI phase, push it to a registry, and then pull that exact image digest for deployments to both staging and production.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Pipeline Stages Mapping',
        description: 'Design the logical stages of a deployment pipeline for a FastAPI application with a PostgreSQL database.',
        hint: 'Think about failing fast and building artifacts only once.',
        solution: 'A standard pipeline design: 1. Lint/Type Check -> 2. Unit Tests -> 3. Build Docker Image -> 4. Security Scan Image -> 5. Integration Tests (using the built image) -> 6. Deploy to Staging -> 7. Manual Approval -> 8. Deploy to Production.',
        solutionCode: {
          id: 'sol-1',
          language: 'markdown',
          title: 'Pipeline Stages',
          filename: 'pipeline.md',
          code: `1. Code Quality: Ruff (Lint) & MyPy (Type Check)
2. Unit Testing: Pytest (fast tests)
3. Build: Build Docker Image & Push to internal registry
4. Security: Scan Docker image with Trivy
5. Integration Testing: Deploy to ephemeral environment & run tests
6. Staging: Promote image to staging environment
7. Gate: Manual approval required
8. Production: Promote image to production environment`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Rebuilding Images for Production',
        description: 'Recompiling or rebuilding Docker images in the production deployment stage.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ Rebuilding',
          code: `deploy-production:
  steps:
    - run: docker build -t myapp:prod .
    - run: docker push myapp:prod
    - run: kubectl apply -f k8s/`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ Promoting Image',
          code: `deploy-production:
  steps:
    # Use the EXACT image built in CI, identified by git SHA
    - run: kubectl set image deployment/myapp myapp=registry/myapp:\${{ github.sha }}`
        }
      }
    ],
    codeExamples: [],
  },
  'github-actions-fundamentals': {
    id: '19-02',
    slug: 'github-actions-fundamentals',
    chapterId: 19,
    order: 2,
    title: 'GitHub Actions Fundamentals',
    description: 'Master the core concepts of GitHub Actions to automate your FastAPI workflows.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.github_actions],
    prerequisites: ['19-01'],
    objectives: [
      'Write workflow YAML from scratch',
      'Use actions from the marketplace',
      'Configure workflow triggers correctly',
      'Use secrets and environment variables'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Workflows, Jobs, and Steps',
        content: `GitHub Actions is a powerful automation platform built directly into GitHub. It allows you to create custom Software Development Life Cycle (SDLC) workflows directly in your GitHub repository. The fundamental building blocks are Workflows, Jobs, and Steps.

A **Workflow** is an automated procedure that you add to your repository. It is defined by a YAML file in the \`.github/workflows\` directory. Workflows are triggered by events, such as pushing a commit, creating a pull request, or on a scheduled cron basis.

A workflow contains one or more **Jobs**. Jobs run in parallel by default, but you can configure them to run sequentially by setting dependencies using the \`needs\` keyword. Each job runs on a specific runner (a virtual machine hosted by GitHub or yourself).

A job consists of a sequence of **Steps**. Steps are individual tasks that can either run a shell command or use an **Action** (a reusable, pre-packaged script, often from the GitHub Marketplace). Steps within a job execute sequentially on the same runner and share the same filesystem, allowing them to pass data to each other.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Writing a Basic FastAPI Workflow',
        content: `Let's construct a foundational GitHub Actions workflow for a FastAPI project. This workflow will trigger on pull requests and pushes to the main branch, set up Python, install dependencies, and run our test suite.

We'll use standard Marketplace actions like \`actions/checkout\` to pull our code and \`actions/setup-python\` to configure the Python environment. Notice how we use \`secrets\` to safely inject sensitive information without exposing it in the codebase.`,
        codeExample: {
          id: 'ga-basic',
          language: 'yaml',
          title: 'Basic CI Workflow',
          filename: '.github/workflows/ci.yml',
          code: `name: FastAPI CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  PYTHON_VERSION: "3.11"

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      # 1. Check out the repository code
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Set up Python environment
      - name: Set up Python \${{ env.PYTHON_VERSION }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ env.PYTHON_VERSION }}
          cache: 'pip' # Automatically caches pip dependencies

      # 3. Install dependencies
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov

      # 4. Run tests with environment variables/secrets
      - name: Run tests
        env:
          DATABASE_URL: \${{ secrets.TEST_DATABASE_URL }}
          API_KEY: \${{ secrets.TEST_API_KEY }}
        run: |
          pytest --cov=app tests/`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Security and Context Variables',
        content: `When building CI pipelines for production, managing secrets is paramount. GitHub Actions provides the \`\${{ secrets.SECRET_NAME }}\` context for this purpose. These secrets are encrypted and only decrypted during workflow execution.

Similarly, GitHub provides context variables like \`github.sha\` (the commit hash), \`github.ref\` (the branch or tag name), and \`github.actor\` (the user who triggered the workflow). These are essential for tagging Docker images, sending notifications, or implementing conditional logic (e.g., only deploying if the branch is \`main\`).

It's also a best practice to pin Actions to a specific commit SHA rather than a version tag (like \`@v3\`) to prevent supply chain attacks if the action repository is compromised and the tag is moved.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Explain the difference between `env` and `secrets` in GitHub Actions.',
        answer: '`env` is used for non-sensitive configuration data (like paths or environment names) and is visible in the workflow logs. `secrets` is used for sensitive data (like API keys or database passwords), is securely stored, and is masked (replaced with ***) in the workflow logs.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-2',
        question: 'How do you share data between different jobs in a GitHub Actions workflow?',
        answer: 'Since jobs run on different virtual machines, they don\'t share a filesystem. You must use Artifacts (uploading in one job, downloading in another) or Job Outputs to pass data between them.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Always specify exact versions (or even better, commit SHAs) for third-party actions used in your workflows to prevent unexpected changes or security vulnerabilities.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Exposed Secret',
        problem: 'A developer echoed an API key to a configuration file during a workflow step without realizing that `echo $SECRET > config.json` would print the secret in plain text if there was a syntax error in the script.',
        solution: 'They refactored the step to use GitHub Actions\' built-in secret masking and generated the config file securely using Python scripts that read from environment variables, avoiding shell evaluations that might leak secrets.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Triggering on Tags',
        description: 'Modify the provided workflow to only run when a new Git tag starting with "v" (e.g., v1.0.0) is pushed.',
        hint: 'Look at the `on.push.tags` configuration.',
        solution: 'Update the `on` block to specify `tags` instead of `branches`.',
        solutionCode: {
          id: 'sol-1',
          language: 'yaml',
          title: 'Tag Trigger',
          filename: 'ci.yml',
          code: `on:
  push:
    tags:
      - 'v*'`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Hardcoding Credentials',
        description: 'Placing sensitive information directly in the workflow YAML.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ Hardcoded Secret',
          code: `steps:
  - run: ./deploy.sh
    env:
      DB_PASS: "super_secret_password123"`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ Using Secrets Context',
          code: `steps:
  - run: ./deploy.sh
    env:
      DB_PASS: \${{ secrets.DB_PASSWORD }}`
        }
      }
    ],
    codeExamples: [],
  },
  'test-automation-ci': {
    id: '19-03',
    slug: 'test-automation-ci',
    chapterId: 19,
    order: 3,
    title: 'Test Automation in CI',
    description: 'Optimize your CI pipeline by caching dependencies, running tests in parallel, and handling databases in CI.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.github_actions, technologies.pytest],
    prerequisites: ['19-02'],
    objectives: [
      'Cache pip dependencies and Docker layers',
      'Run tests in parallel with matrix strategy',
      'Use Testcontainers or Services in CI correctly',
      'Upload test reports as artifacts'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Advanced Testing Strategies in CI',
        content: `Running tests in CI is essential, but as your FastAPI application grows, a naive approach will result in unacceptably slow pipeline times. To maintain developer velocity, you must optimize test execution.

Two primary strategies exist: **Caching** and **Parallelization**. Caching ensures that you don't download the same pip packages or rebuild identical Docker layers on every run. Parallelization divides your test suite across multiple concurrent runners, drastically reducing total execution time.

Furthermore, integration tests require real infrastructure (like PostgreSQL or Redis). While you can mock these, testing against real instances provides higher confidence. In CI, this is typically achieved using GitHub Actions Service Containers or tools like Testcontainers.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Matrix Testing with Services',
        content: `This advanced workflow demonstrates testing a FastAPI app across multiple Python versions concurrently using a Matrix strategy. It also spins up a PostgreSQL database as a Service Container, ensuring our database integration tests run against a real database.

Finally, we generate a JUnit XML report and upload it as a workflow artifact, allowing developers to inspect test failures directly in the GitHub UI.`,
        codeExample: {
          id: 'ga-advanced-tests',
          language: 'yaml',
          title: 'Advanced Test Automation',
          filename: '.github/workflows/tests.yml',
          code: `name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    # 1. Matrix Strategy: Run tests concurrently on Python 3.10 and 3.11
    strategy:
      matrix:
        python-version: ["3.10", "3.11"]
      fail-fast: false # Don't cancel 3.11 if 3.10 fails

    # 2. Service Containers: Spin up PostgreSQL
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov

      # 3. Run Tests against the Service Container
      - name: Run Pytest
        env:
          DATABASE_URL: postgresql+asyncpg://testuser:testpassword@localhost:5432/testdb
        run: |
          pytest tests/ \\
            --cov=app \\
            --junitxml=pytest-results-\${{ matrix.python-version }}.xml

      # 4. Upload Test Results as Artifacts
      - name: Upload Test Results
        if: always() # Run even if tests fail
        uses: actions/upload-artifact@v4
        with:
          name: pytest-results-\${{ matrix.python-version }}
          path: pytest-results-\${{ matrix.python-version }}.xml
          retention-days: 7`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Flaky Tests and Retries',
        content: `In production CI environments, "flaky tests" (tests that intermittently pass or fail without code changes) are a major source of friction. They erode trust in the CI pipeline.

When integration testing against databases or external services, network latency or asynchronous operations can cause flakiness. While the root cause should always be fixed, using plugins like \`pytest-rerunfailures\` can mitigate the impact by automatically retrying failed tests a specified number of times before failing the pipeline. However, rely on this sparingly, as it masks underlying instability.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is a matrix strategy in CI pipelines?',
        answer: 'A matrix strategy allows you to define a set of variables (like OS, Python version, or database type) and the CI runner automatically generates and executes a separate job for every combination of those variables concurrently.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-2',
        question: 'How do you handle database dependencies when running integration tests in GitHub Actions?',
        answer: 'You can use GitHub Actions "Service Containers" to spin up Docker containers (like PostgreSQL or Redis) alongside your test job. Alternatively, you can use a library like Testcontainers within your Python test suite to programmatically manage container lifecycles.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'Use `if: always()` on the artifact upload step for test reports. If the tests fail, you still want to upload the report to see *why* they failed.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Slow Pipeline Epidemic',
        problem: 'As the test suite grew, the CI pipeline took 45 minutes to run, causing a massive bottleneck for developers waiting to merge PRs.',
        solution: 'The team implemented pytest-xdist to parallelize test execution across CPU cores within the runner, and split the test suite into "unit" and "integration" jobs running concurrently on different runners. This reduced pipeline time to 8 minutes.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Adding Redis as a Service',
        description: 'Modify the provided workflow to add a Redis service container and expose it to the test environment.',
        hint: 'Add another block under the `services` section and configure port mapping.',
        solution: 'Add a `redis` service under `services` with port 6379, and set the REDIS_URL env var.',
        solutionCode: {
          id: 'sol-1',
          language: 'yaml',
          title: 'Redis Service',
          filename: 'tests.yml',
          code: `    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Missing Database Readiness Checks',
        description: 'Starting tests before the service container database is fully initialized.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ No Healthcheck',
          code: `services:
  postgres:
    image: postgres:15
    ports:
      - 5432:5432`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ With Healthcheck',
          code: `services:
  postgres:
    image: postgres:15
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5`
        }
      }
    ],
    codeExamples: [],
  },
  'linting-type-checking-ci': {
    id: '19-04',
    slug: 'linting-type-checking-ci',
    chapterId: 19,
    order: 4,
    title: 'Linting & Type Checking in CI',
    description: 'Enforce code quality and catch errors early by integrating Ruff and MyPy into your CI pipelines.',
    duration: 35,
    difficulty: 'advanced',
    technologies: [technologies.github_actions, technologies.python],
    prerequisites: ['19-02'],
    objectives: [
      'Run Ruff check in CI pipeline',
      'Run MyPy with --strict in CI',
      'Fail fast on linting errors',
      'Cache MyPy type cache for speed'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The First Line of Defense',
        content: `Linting and type checking should be the absolute first step in your CI pipeline. These static analysis tools parse your code without running it, allowing them to execute extremely quickly. They catch syntax errors, style violations, unused imports, and type mismatches.

By placing these checks in a separate, initial CI job, you achieve the "Fail Fast" principle. If a developer forgets a colon or introduces a type error, the CI pipeline fails in seconds, not minutes, saving valuable runner minutes and providing immediate feedback.

In modern Python/FastAPI stacks, **Ruff** has become the standard for linting and formatting due to its incredible speed (written in Rust), while **MyPy** remains the standard for static type checking.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Creating a Code Quality Job',
        content: `This workflow demonstrates setting up a dedicated code quality job. Notice that we use actions specifically designed for Ruff, which are faster than ` + "`pip install ruff`" + `.

For MyPy, caching is critical. MyPy builds a local cache (\`.mypy_cache\`) to avoid re-analyzing unchanged files. In CI, we must explicitly preserve this cache between runs to maintain performance.`,
        codeExample: {
          id: 'ga-lint',
          language: 'yaml',
          title: 'Code Quality Workflow',
          filename: '.github/workflows/lint.yml',
          code: `name: Code Quality

on: [push, pull_request]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: 'pip'

      # 1. Run Ruff for formatting and linting
      - name: Run Ruff Linter
        uses: astral-sh/ruff-action@v1
        with:
          args: 'check .' # Fails if linting errors exist

      - name: Run Ruff Formatter check
        uses: astral-sh/ruff-action@v1
        with:
          args: 'format --check .' # Fails if files aren't formatted

      # 2. Install dependencies (MyPy needs them to check types accurately)
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install mypy types-redis

      # 3. Cache MyPy directory to speed up future runs
      - name: Cache MyPy
        uses: actions/cache@v4
        with:
          path: .mypy_cache
          key: \${{ runner.os }}-mypy-\${{ hashFiles('**/*.py') }}
          restore-keys: |
            \${{ runner.os }}-mypy-

      # 4. Run MyPy Type Checker
      - name: Run MyPy
        run: mypy app/`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Enforcing Strict MyPy',
        content: `When starting a new FastAPI project, it is highly recommended to configure MyPy strictly from day one. Retrofitting strict type checking onto a large existing codebase is painful.

In your \`pyproject.toml\`, set \`strict = true\`. This forces developers to type-hint every function parameter and return type, ensuring that FastAPI's dependency injection and Pydantic validation are backed by rock-solid type guarantees throughout your business logic. The CI pipeline ensures this standard never slips.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Why do we need to install project dependencies just to run the MyPy type checker?',
        answer: 'MyPy needs to analyze the types of imported libraries. If it cannot find the installed library (or its type stubs), it cannot verify that your code interacts with that library correctly, resulting in "Missing import" errors.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-2',
        question: 'What is the advantage of running Ruff in CI using `astral-sh/ruff-action` over `pip install ruff && ruff check`?',
        answer: 'The action is optimized, handles problem matchers (which annotates PRs directly with inline comments in the GitHub UI), and avoids the overhead of setting up a Python environment and pip installing just for linting, making it slightly faster and more integrated.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'Use GitHub Actions Problem Matchers for MyPy so that type errors show up as inline annotations on Pull Request code diffs, rather than just in the workflow logs.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Silent Type Regression',
        problem: 'A team added type hints, but developers frequently ignored MyPy errors locally. Because MyPy was not enforced in CI, type safety degraded, leading to a production AttributeError when an expected dict was actually a list.',
        solution: 'MyPy was added to the CI pipeline as a blocking step. They used a baseline file for existing errors and enforced `strict = true` for all new modules.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Pipeline Optimization',
        description: 'How would you modify a complete CI workflow (containing both linting and testing) to ensure tests DO NOT run if linting fails?',
        hint: 'Look into Job Dependencies in GitHub Actions.',
        solution: 'Use the `needs` keyword in the test job, pointing to the linting job.',
        solutionCode: {
          id: 'sol-1',
          language: 'yaml',
          title: 'Job Dependencies',
          filename: 'ci.yml',
          code: `jobs:
  lint:
    runs-on: ubuntu-latest
    steps: ...

  test:
    needs: lint # Test job waits for lint job to succeed
    runs-on: ubuntu-latest
    steps: ...`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Not checking formatting in CI',
        description: 'Only running `ruff format` locally, but not enforcing it in CI, leading to formatting wars in PR reviews.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ Missing Format Check',
          code: `- name: Lint
  run: ruff check .`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ Enforcing Format Check',
          code: `- name: Lint
  run: ruff check .
- name: Format
  run: ruff format --check .`
        }
      }
    ],
    codeExamples: [],
  },
  'security-scanning-ci': {
    id: '19-05',
    slug: 'security-scanning-ci',
    chapterId: 19,
    order: 5,
    title: 'Security Scanning in CI',
    description: 'Integrate automated security checks to prevent vulnerabilities from reaching production.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.github_actions, technologies.docker],
    prerequisites: ['19-02'],
    objectives: [
      'Scan Docker images with Trivy in CI',
      'Run bandit for Python security linting',
      'Check dependencies with safety/pip-audit',
      'Block deployments on critical vulnerabilities'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Shifting Left on Security',
        content: `"Shifting left" means moving security testing earlier in the software development lifecycle. By integrating security scans directly into the CI pipeline, developers get immediate feedback about vulnerabilities in their code, dependencies, or Docker images before those vulnerabilities ever reach a deployed environment.

Security in CI typically involves three layers:
1. **SAST (Static Application Security Testing):** Scanning your Python code for known dangerous patterns (e.g., hardcoded passwords, SQL injection vulnerabilities, unsafe deserialization). The standard Python tool is \`bandit\`.
2. **SCA (Software Composition Analysis):** Checking your dependencies (\`requirements.txt\` or \`Pipfile\`) against databases of known vulnerabilities (CVEs). Tools include \`safety\`, \`pip-audit\`, or GitHub's Dependabot.
3. **Container Scanning:** Analyzing the built Docker image for vulnerable OS packages or misconfigurations. \`Trivy\` is the industry standard open-source tool for this.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing the Security Toolchain',
        content: `This workflow demonstrates a comprehensive security pipeline. It runs Bandit to analyze the code, pip-audit to check Python dependencies, and Trivy to scan the built Docker image.

Crucially, Trivy is configured to exit with a non-zero code (failing the pipeline) only if it finds vulnerabilities marked as 'CRITICAL' or 'HIGH'. This prevents the pipeline from blocking on low-risk issues while ensuring severe flaws cannot be deployed.`,
        codeExample: {
          id: 'ga-security',
          language: 'yaml',
          title: 'Comprehensive Security Scan',
          filename: '.github/workflows/security.yml',
          code: `name: Security Scans

on:
  push:
    branches: [ "main" ]
  pull_request:

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      # 1. Code Security (SAST) with Bandit
      - name: Install Bandit
        run: pip install bandit
      - name: Run Bandit
        run: bandit -r app/ -c pyproject.toml

      # 2. Dependency Audit (SCA)
      - name: Install pip-audit
        run: pip install pip-audit
      - name: Run pip-audit
        run: pip-audit -r requirements.txt

      # 3. Build Docker Image (Local to runner)
      - name: Build local Docker image
        run: docker build -t myapp:\${{ github.sha }} .

      # 4. Container Vulnerability Scan with Trivy
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:\${{ github.sha }}'
          format: 'table'
          # Fail pipeline only on High and Critical vulnerabilities
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'`
        }
      },
      {
        id: 'production',
        type: 'production',
        title: 'Handling False Positives and Baselines',
        content: `Security tools generate false positives. If the CI pipeline frequently fails due to false alarms, developers will start ignoring or bypassing the security checks.

To manage this, all security tools support configuration to ignore specific rules or CVEs. 
- In Bandit, you can add \`# nosec\` to a line of code.
- In Trivy, you can provide a \`.trivyignore\` file containing specific CVE IDs to skip.
- It is vital to maintain a documented process for triaging vulnerabilities and intentionally updating ignore lists, ensuring legitimate issues aren't accidentally swept under the rug.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Explain the difference between SAST and SCA in a CI pipeline.',
        answer: 'SAST (Static Application Security Testing) analyzes your proprietary source code for insecure coding patterns (e.g., using Bandit). SCA (Software Composition Analysis) scans your third-party dependencies (libraries, frameworks) against databases of known vulnerabilities (CVEs).',
        difficulty: 'advanced'
      },
      {
        id: 'iq-2',
        question: 'Why do we pass `ignore-unfixed: true` to Trivy in CI pipelines?',
        answer: 'If an OS vulnerability is discovered but the vendor (e.g., Debian/Alpine) hasn\'t released a patch for it yet, there is nothing the developer can do to fix it. Failing the pipeline for unpatchable issues halts development unnecessarily.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Schedule a nightly security scan on the main branch. A Docker image that passed Trivy today might be vulnerable tomorrow when a new CVE is discovered. CI on PRs only catches vulnerabilities introduced by new code.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Malicious Dependency',
        problem: 'A developer accidentally typo-squatted a popular package name in requirements.txt (e.g., reqeusts instead of requests), pulling in a malicious payload.',
        solution: 'Because the CI pipeline included `pip-audit`, the malicious package (which had already been flagged in PyPI vulnerability databases) caused the build to fail immediately, preventing a severe security breach.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Ignoring Bandit False Positives',
        description: 'Bandit is complaining about a hardcoded password string in your test file, failing the build. How do you tell Bandit to ignore this specific line?',
        hint: 'You can use a specific comment on the line of code.',
        solution: 'Append `# nosec` or `# nosec B105` to the end of the line containing the mock password.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Ignoring Bandit',
          filename: 'test_auth.py',
          code: `def test_login():
    mock_password = "super_secret_password"  # nosec B105
    assert check_password(mock_password)`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Blocking on Low Severity Vulns',
        description: 'Failing the build on LOW or MEDIUM severity vulnerabilities in base Docker images often blocks feature delivery for minimal security gain.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ Too Strict',
          code: `with:
  severity: 'UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL'
  exit-code: '1'`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ Pragmatic',
          code: `with:
  severity: 'HIGH,CRITICAL'
  ignore-unfixed: true
  exit-code: '1'`
        }
      }
    ],
    codeExamples: [],
  },
  'docker-build-push': {
    id: '19-06',
    slug: 'docker-build-push',
    chapterId: 19,
    order: 6,
    title: 'Docker Build & Registry Push in CI',
    description: 'Automate Docker image building, tagging strategies, and pushing to container registries using GitHub Actions.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.github_actions, technologies.docker],
    prerequisites: ['19-02'],
    objectives: [
      'Build multi-platform Docker images in CI',
      'Tag images with git SHA and semantic version',
      'Push to GitHub Container Registry',
      'Use Docker BuildKit cache in CI'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Continuous Delivery Artifact',
        content: `Once code passes linting, tests, and security scans, the next step is creating the release artifact. For FastAPI applications, this artifact is a Docker image.

The CI pipeline must build the image, apply appropriate tags, and push it to a container registry (like Docker Hub, AWS ECR, or GitHub Container Registry - GHCR). 

**Tagging Strategy** is critical. You should never rely solely on the \`latest\` tag. A robust strategy tags every image built from the main branch with the Git Commit SHA. This provides a direct, immutable link between the running code in production and the exact commit in GitHub. Additionally, semantic version tags (e.g., \`v1.2.0\`) can be applied when Git releases are created.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Building and Pushing with Buildx',
        content: `GitHub provides excellent official actions for building Docker images. We use \`docker/login-action\` to authenticate with the registry, \`docker/metadata-action\` to automatically generate appropriate tags (SHA, branch name, or semantic version), and \`docker/build-push-action\` to perform the actual build using BuildKit.

Notice the \`cache-from\` and \`cache-to\` arguments. Docker builds in CI can be slow because the runner starts with an empty Docker cache. By leveraging GitHub Actions cache or an inline registry cache, we can dramatically speed up builds by reusing unchanged layers from previous pipeline runs.`,
        codeExample: {
          id: 'ga-docker-push',
          language: 'yaml',
          title: 'Docker Build and Push Workflow',
          filename: '.github/workflows/docker.yml',
          code: `name: Build and Push Docker Image

on:
  push:
    branches: [ "main" ]
    tags: [ 'v*.*.*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }} # e.g., username/repo

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # Required to push to GHCR

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # 1. Set up Docker Buildx (BuildKit)
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # 2. Login to Registry
      - name: Log in to the Container registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }} # Automatically provided by Actions

      # 3. Extract metadata (tags, labels) for Docker
      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=long # Creates a tag with the full git commit SHA
            type=ref,event=branch
            type=semver,pattern={{version}}

      # 4. Build and push Docker image with caching
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha # Use GitHub Actions cache
          cache-to: type=gha,mode=max`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Multi-Platform Builds',
        content: `As ARM architecture (like AWS Graviton or Apple Silicon) becomes more prevalent, building images only for AMD64 (Intel) is no longer sufficient. Docker Buildx enables multi-platform builds in CI.

By simply adding \`platforms: linux/amd64,linux/arm64\` to the \`build-push-action\`, Buildx will orchestrate building the image for both architectures and assemble them into a single multi-architecture manifest in the registry. A Kubernetes cluster pulling that image will automatically download the correct architecture for its underlying nodes.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Why is tagging Docker images with the Git SHA better than using the `latest` tag?',
        answer: 'The `latest` tag is mutable; it overwrites the previous image, making it impossible to know exactly which version of code is running in production. Git SHA tags are immutable and provide traceability directly back to the exact code commit that built the image.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-2',
        question: 'How does Docker layer caching work in ephemeral CI environments like GitHub Actions?',
        answer: 'Since CI runners are destroyed after each run, the local Docker cache is lost. Tools like Docker Buildx can export the cache to an external store (like GitHub Actions Cache API or an external registry) and import it on the next run, preventing the need to rebuild unchanged layers (like downloading pip dependencies).',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Ensure the GitHub Token used to push to the registry has the principle of least privilege. In the example, `permissions: packages: write` explicitly grants only the required access.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Missing Docker Cache',
        problem: 'A CI pipeline took 15 minutes because it re-downloaded hundreds of MBs of PyTorch libraries on every commit, even if only application logic changed.',
        solution: 'Implemented Docker BuildKit caching (`cache-from=type=gha`). Subsequent builds where requirements.txt hadn\'t changed skipped the pip install layer entirely, dropping build times to 3 minutes.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Multi-Arch Build Configuration',
        description: 'Modify the build-push-action configuration to build for both AMD64 and ARM64 architectures.',
        hint: 'Use the `platforms` key.',
        solution: 'Add `platforms: linux/amd64,linux/arm64` to the `with` block of the build step.',
        solutionCode: {
          id: 'sol-1',
          language: 'yaml',
          title: 'Multi-Arch Build',
          filename: 'docker.yml',
          code: `      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          platforms: linux/amd64,linux/arm64
          tags: \${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Overwriting the Latest Tag blindly',
        description: 'Only tagging images with `latest`, causing race conditions and rollback nightmares.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ Only Latest',
          code: `with:
  tags: myregistry.com/myapp:latest`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ SHA and Latest',
          code: `with:
  tags: |
    myregistry.com/myapp:latest
    myregistry.com/myapp:\${{ github.sha }}`
        }
      }
    ],
    codeExamples: [],
  },
  'deployment-automation': {
    id: '19-07',
    slug: 'deployment-automation',
    chapterId: 19,
    order: 7,
    title: 'Automated Deployment',
    description: 'Connect your CI pipeline to your infrastructure to automate deployments to staging and production.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.github_actions, technologies.kubernetes],
    prerequisites: ['19-06'],
    objectives: [
      'Deploy to staging on every merged PR',
      'Require manual approval for production',
      'Configure environment-specific variables in GitHub',
      'Implement smoke tests post-deployment'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Continuous Deployment Methodologies',
        content: `Automating the deployment step bridges the gap between code integration and delivering value to users. For robust production systems, deployment isn't a single step; it's a phased rollout across multiple environments.

A standard flow is:
1. **Continuous Deployment to Staging:** Every commit merged to the \`main\` branch automatically builds, tests, and deploys to a staging environment. This keeps staging exactly synchronized with the head of the repository.
2. **Continuous Delivery to Production:** Deploying to production is automated, but requires a human "click" to trigger. GitHub Actions handles this beautifully using **Environments** and **Protection Rules**.

When deploying, the pipeline must update the infrastructure state (e.g., updating a Kubernetes Deployment manifest with the new image SHA) and verify the deployment succeeded.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Deploying to Environments with Approvals',
        content: `This workflow demonstrates deploying a built Docker image to Kubernetes. It uses GitHub Actions Environments. By configuring the "production" environment in GitHub repository settings to require reviewer approval, this workflow will pause after deploying to staging, waiting for a human to click "Approve" before proceeding to the production job.

It also demonstrates using a "Smoke Test" — a fast, lightweight test run against the live API URL immediately after deployment to verify the service is actually up and responding.`,
        codeExample: {
          id: 'ga-deploy',
          language: 'yaml',
          title: 'Deployment Pipeline',
          filename: '.github/workflows/deploy.yml',
          code: `name: CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  build:
    # ... (Docker build and push step from previous lesson) ...
    runs-on: ubuntu-latest
    outputs:
      image_tag: \${{ steps.set-tag.outputs.tag }}
    steps:
      - run: echo "tag=\${{ github.sha }}" >> $GITHUB_OUTPUT
        id: set-tag

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      # 1. Authenticate with Kubernetes cluster (Example using kubeconfig)
      - name: Set up Kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "\${{ secrets.KUBECONFIG }}" > ~/.kube/config

      # 2. Update Kubernetes Deployment
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/fastapi-api \\
            api=ghcr.io/myorg/myapp:\${{ needs.build.outputs.image_tag }} \\
            -n staging
          
          # Wait for rollout to complete
          kubectl rollout status deployment/fastapi-api -n staging --timeout=120s

      # 3. Post-deployment Smoke Test
      - name: Run Smoke Test
        run: |
          curl --fail -s https://staging-api.myorg.com/health || exit 1

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    # This environment should be configured in GitHub UI to require approval
    environment: production 
    
    steps:
      - name: Set up Kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "\${{ secrets.KUBECONFIG_PROD }}" > ~/.kube/config

      - name: Deploy to K8s Production
        run: |
          kubectl set image deployment/fastapi-api \\
            api=ghcr.io/myorg/myapp:\${{ needs.build.outputs.image_tag }} \\
            -n production
          
          kubectl rollout status deployment/fastapi-api -n production --timeout=300s`
        }
      },
      {
        id: 'realworld',
        type: 'realworld',
        title: 'Configuration Injection via Environments',
        content: `GitHub Environments allow you to scope secrets and variables. You can have a secret named \`DATABASE_URL\` that resolves to the staging DB credentials when the \`deploy-staging\` job runs, and to the production DB credentials when the \`deploy-production\` job runs.

This cleanly separates configuration from code and pipeline logic. The pipeline YAML remains identical for both stages; only the injected environment context changes.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the purpose of the `kubectl rollout status` command in a deployment pipeline?',
        answer: '`kubectl set image` is asynchronous; it tells Kubernetes to start the update but returns immediately. `rollout status` blocks the CI pipeline until Kubernetes confirms that the new pods are fully running and healthy, preventing the pipeline from reporting a "success" if the new containers are crash-looping.',
        difficulty: 'advanced'
      },
      {
        id: 'iq-2',
        question: 'How do you implement a manual approval step before deploying to production using GitHub Actions?',
        answer: 'You create an "Environment" in the GitHub repository settings (e.g., named "production"). In the settings for that environment, you enable "Required reviewers". In your workflow YAML, you assign the production deployment job to `environment: production`.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never use the same API keys or credentials for deployments across different environments. Staging and Production must be physically and logically isolated at the credential level.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Silent Deployment Failure',
        problem: 'A CI pipeline deployed a new image tag and marked the job as "Green" (Successful). However, the application crashed on startup due to a missing environment variable. Production went down, but the CI pipeline claimed everything was fine.',
        solution: 'The pipeline lacked a readiness check. By adding `kubectl rollout status` and a subsequent cURL-based smoke test against the `/health` endpoint, the CI pipeline correctly blocks and fails if the application doesn\'t successfully boot.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Dynamic Smoke Testing',
        description: 'Update the smoke test step to use an environment variable for the API URL, allowing the same step to be reused in staging and production jobs.',
        hint: 'Use the `env` context provided by GitHub Environments.',
        solution: 'Define API_URL in the job\'s environment variables (or rely on GitHub Environment variables) and use it in the curl command.',
        solutionCode: {
          id: 'sol-1',
          language: 'yaml',
          title: 'Reusable Smoke Test',
          filename: 'deploy.yml',
          code: `      - name: Run Smoke Test
        env:
          API_URL: \${{ vars.API_URL }} # Provided by GitHub Environment variables
        run: |
          curl --fail -s \${API_URL}/health || exit 1`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Fire and Forget Deployments',
        description: 'Triggering a deployment without waiting for it to stabilize.',
        badCode: {
          id: 'bad-1',
          language: 'yaml',
          title: '❌ Fire and Forget',
          code: `- run: kubectl set image deployment/api api=myimage:latest`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ Wait for Rollout',
          code: `- run: |
    kubectl set image deployment/api api=myimage:\${{ github.sha }}
    kubectl rollout status deployment/api --timeout=120s`
        }
      }
    ],
    codeExamples: [],
  },
  'rollback-strategies': {
    id: '19-08',
    slug: 'rollback-strategies',
    chapterId: 19,
    order: 8,
    title: 'Rollback Strategies',
    description: 'Design automated rollback mechanisms to recover from deployment failures instantly.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.github_actions, technologies.kubernetes],
    prerequisites: ['19-07'],
    objectives: [
      'Implement one-click rollback in GitHub Actions',
      'Use Kubernetes rollout undo for K8s deployments',
      'Store rollback artifacts in registry',
      'Test rollback procedure before going to production'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Mean Time To Recovery (MTTR)',
        content: `Despite rigorous testing, bad deployments will inevitably reach production. When this happens, fixing the bug and rolling forward (pushing a new fix through the entire CI/CD pipeline) often takes too long. Your priority must be Mean Time To Recovery (MTTR) — getting the system back to a stable state instantly.

Rollbacks should be a standard, tested, one-click operation. Because we adhere to the "Build Once, Deploy Many" principle and tag our images with Git SHAs, rolling back is trivially easy: we simply deploy the *previous* image tag. 

In modern orchestrators like Kubernetes, this is a native feature. Kubernetes tracks the history of Deployments (ReplicaSets), allowing instant reversions to previous states.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Manual Trigger Rollback Workflow',
        content: `We can create a dedicated GitHub Actions workflow specifically for rollbacks. Using the \`workflow_dispatch\` trigger, developers can manually trigger this action from the GitHub UI, providing an input parameter for the specific Git SHA (image tag) they want to revert to.

Alternatively, we can leverage Kubernetes' native \`rollout undo\` command.`,
        codeExample: {
          id: 'ga-rollback',
          language: 'yaml',
          title: 'Rollback Workflow',
          filename: '.github/workflows/rollback.yml',
          code: `name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      target_sha:
        description: 'Git SHA to rollback to (Leave empty for previous deployment)'
        required: false
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production # Uses production credentials

    steps:
      - name: Set up Kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "\${{ secrets.KUBECONFIG_PROD }}" > ~/.kube/config

      # If SHA is provided, set specific image
      - name: Rollback to specific SHA
        if: \${{ github.event.inputs.target_sha != '' }}
        run: |
          kubectl set image deployment/fastapi-api \\
            api=ghcr.io/myorg/myapp:\${{ github.event.inputs.target_sha }} \\
            -n production
          
          kubectl rollout status deployment/fastapi-api -n production --timeout=300s

      # If no SHA provided, use K8s native undo (reverts to previous ReplicaSet)
      - name: Rollback to Previous (Native Undo)
        if: \${{ github.event.inputs.target_sha == '' }}
        run: |
          kubectl rollout undo deployment/fastapi-api -n production
          
          kubectl rollout status deployment/fastapi-api -n production --timeout=300s`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Database Migrations and Rollbacks',
        content: `While rolling back application code is easy, rolling back a database schema is notoriously difficult. If your bad deployment included an Alembic migration that dropped a column, rolling back the application code will result in the old code crashing because it expects that column to exist.

**The Golden Rule of Database Migrations in CI/CD:** Migrations must always be backward compatible with the currently running code.

To achieve this, complex changes must be split across multiple deployments (e.g., Deploy 1: Add new column; Deploy 2: App starts writing to both old and new columns; Deploy 3: App reads from new column; Deploy 4: Drop old column). This ensures that if you rollback the application code at any stage, the database schema remains compatible.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Why is rolling back database schema changes fundamentally harder than rolling back application code?',
        answer: 'Application code is stateless and immutable artifacts (Docker images) can be swapped instantly. Databases hold state; rolling back a schema (like dropping a newly added table or recreating a dropped column) often involves irreversible data loss or complex data restoration scripts.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'What is the purpose of the `workflow_dispatch` trigger in GitHub Actions?',
        answer: '`workflow_dispatch` allows workflows to be triggered manually via the GitHub web UI or API, and allows developers to pass custom input parameters to the workflow execution. It is ideal for operational tasks like rollbacks or manual database syncs.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Your rollback procedure is useless if it isn\'t tested. Schedule regular "Game Days" where you intentionally deploy a broken version to Staging and verify that your rollback workflow successfully restores the service.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Unrecoverable Database State',
        problem: 'A deployment included an Alembic migration that renamed a critical column. The new app logic contained a memory leak and crashed. The team rolled back the deployment, but the old app code instantly crashed because the old column name no longer existed.',
        solution: 'The system was down until a frantic hotfix was written. Post-mortem resolution required enforcing the "expand and contract" pattern for database migrations, prohibiting destructive operations (drops, renames) in a single deployment step.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Automated Failure Rollback',
        description: 'How would you modify a deployment workflow to automatically rollback to the previous deployment if the smoke test fails?',
        hint: 'Use the `if: failure()` conditional step.',
        solution: 'Add a step that runs only if previous steps fail, executing a `kubectl rollout undo`.',
        solutionCode: {
          id: 'sol-1',
          language: 'yaml',
          title: 'Auto-rollback',
          filename: 'deploy.yml',
          code: `      - name: Run Smoke Test
        run: curl --fail -s https://api.production.com/health || exit 1
        
      - name: Auto-rollback on Failure
        if: failure()
        run: |
          echo "Smoke test failed! Reverting to previous state..."
          kubectl rollout undo deployment/fastapi-api -n production
          exit 1 # Ensure pipeline still reports failure`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Relying on Git Revert for Immediate Fixes',
        description: 'Using `git revert` and pushing to main to trigger the CI pipeline to fix a production outage. The pipeline takes 15 minutes to run tests and build images, resulting in 15 minutes of downtime.',
        badCode: {
          id: 'bad-1',
          language: 'bash',
          title: '❌ Slow Rollback',
          code: `git revert HEAD
git push origin main
# Wait 15 minutes for CI pipeline to finish...`
        },
        goodCode: {
          id: 'good-1',
          language: 'bash',
          title: '✅ Instant Rollback',
          code: `# Trigger workflow_dispatch rollback or run locally
kubectl rollout undo deployment/api -n production`
        }
      }
    ],
    codeExamples: [],
  },
  'jenkins-pipelines': {
    id: '19-09',
    slug: 'jenkins-pipelines',
    chapterId: 19,
    order: 9,
    title: 'Jenkins Pipelines & Jenkinsfile',
    description: 'Learn to write Declarative Jenkins pipelines as an alternative to GitHub Actions.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.jenkins],
    prerequisites: ['19-01'],
    objectives: [
      'Write declarative Jenkinsfile from scratch',
      'Configure Jenkins agents and credentials',
      'Use parallel stages for faster pipelines',
      'Implement Jenkins shared library for reuse'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Jenkins: The Industry Workhorse',
        content: `While GitHub Actions is modern and deeply integrated, Jenkins remains deeply entrenched in enterprise environments. Jenkins approaches CI/CD using "Pipelines as Code" defined in a \`Jenkinsfile\` written in Groovy syntax.

Jenkins Pipelines come in two flavors: **Scripted** (older, highly flexible, requires deep Groovy knowledge) and **Declarative** (newer, structured, easier to read and maintain). We focus on Declarative Pipelines, which enforce a specific structure of \`pipeline\`, \`agent\`, \`stages\`, and \`steps\`.

Jenkins operates on a master-agent architecture. The master node orchestrates the jobs, while the agent nodes (often Docker containers or temporary cloud VMs) execute the actual build steps.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'A Comprehensive Jenkinsfile',
        content: `This example demonstrates a complete Declarative Jenkinsfile for a FastAPI project. It configures the pipeline to run inside a Python Docker agent, ensuring a clean environment for every build.

It uses Jenkins' \`withCredentials\` block to securely inject secrets stored in Jenkins Credentials Manager, and showcases the \`parallel\` block to run Linting and Testing concurrently, drastically reducing overall build time.`,
        codeExample: {
          id: 'jenkins-basic',
          language: 'groovy',
          title: 'Declarative Jenkinsfile',
          filename: 'Jenkinsfile',
          code: `pipeline {
    agent {
        docker {
            image 'python:3.11-slim'
            // Ensure agent can communicate with docker daemon if building images
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        APP_NAME = 'fastapi-app'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'python -m pip install --upgrade pip'
                sh 'pip install -r requirements.txt'
                sh 'pip install ruff pytest pytest-cov'
            }
        }

        stage('Code Quality & Tests') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'ruff check .'
                    }
                }
                stage('Test') {
                    steps {
                        withCredentials([string(credentialsId: 'TEST_DB_URL', variable: 'DATABASE_URL')]) {
                            sh 'pytest --cov=app --junitxml=results.xml tests/'
                        }
                    }
                    post {
                        always {
                            junit 'results.xml'
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker') {
            when {
                branch 'main' // Only build images on main branch
            }
            steps {
                script {
                    // Script block needed for complex logic or variable assignment in declarative
                    def imageTag = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def image = docker.build("myregistry.com/\${APP_NAME}:\${imageTag}")
                    
                    withCredentials([usernamePassword(credentialsId: 'REGISTRY_CREDS', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                        sh "echo \$PASS | docker login myregistry.com -u \$USER --password-stdin"
                        image.push()
                    }
                }
            }
        }
    }
    
    post {
        failure {
            echo "Pipeline failed. Sending Slack notification..."
            // requires slack plugin
            // slackSend color: 'danger', message: "Build Failed: \${env.JOB_NAME} [\${env.BUILD_NUMBER}]"
        }
    }
}`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Jenkins Shared Libraries',
        content: `In large organizations with dozens of microservices, copying and pasting the same Jenkinsfile across repositories becomes a maintenance nightmare. Jenkins solves this with **Shared Libraries**.

A Shared Library allows you to define reusable Groovy functions and pipeline templates in a separate Git repository. You can abstract the complexity of building a Python microservice into a single function, so developers only need a 3-line Jenkinsfile in their repository calling \`standardPythonPipeline(appName: 'my-api')\`.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the difference between Declarative and Scripted Jenkins pipelines?',
        answer: 'Declarative pipelines provide a more structured, readable syntax with predefined sections (pipeline, agent, stages, steps). Scripted pipelines are pure Groovy code running on the Jenkins master, offering unlimited flexibility but becoming harder to maintain and prone to performance issues.',
        difficulty: 'intermediate'
      },
      {
        id: 'iq-2',
        question: 'How do you run jobs concurrently in a Declarative Jenkinsfile?',
        answer: 'You use the `parallel` block within a `stage`. Inside the parallel block, you define multiple nested stages that Jenkins will attempt to execute simultaneously across available agents.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Never run builds on the Jenkins Master node (built-in node). Always configure separate agent nodes (ideally ephemeral Docker/K8s agents) to prevent runaway builds from crashing the Jenkins orchestration server.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Dependency Hell Build',
        problem: 'Two Jenkins jobs ran simultaneously on the same persistent build server. One job upgraded a global Python package, causing the other job to fail randomly.',
        solution: 'The pipeline was updated to use Docker agents (`agent { docker { ... } }`). Jenkins automatically spins up a pristine, isolated Docker container for every pipeline execution, entirely eliminating cross-job interference.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Conditional Execution in Jenkins',
        description: 'Modify a Jenkins stage to only execute if the deployment branch is `production` AND the developer triggered the build manually.',
        hint: 'Look at the `when` block conditions `branch` and `triggeredBy`.',
        solution: 'Use an `allOf` condition within the `when` block.',
        solutionCode: {
          id: 'sol-1',
          language: 'groovy',
          title: 'Conditional Stage',
          filename: 'Jenkinsfile',
          code: `        stage('Deploy Prod') {
            when {
                allOf {
                    branch 'production'
                    triggeredBy 'UserIdCause' // Manually triggered
                }
            }
            steps {
                sh './deploy.sh prod'
            }
        }`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Leaking Secrets in Shell Steps',
        description: 'Using shell string interpolation for secrets, which exposes them in process lists or logs.',
        badCode: {
          id: 'bad-1',
          language: 'groovy',
          title: '❌ Groovy Interpolation',
          code: `withCredentials([string(credentialsId: 'MY_SECRET', variable: 'SECRET')]) {
    // Double quotes execute string interpolation in Groovy before sending to shell
    sh "curl -H 'Authorization: \${SECRET}' api.com" 
}`
        },
        goodCode: {
          id: 'good-1',
          language: 'groovy',
          title: '✅ Shell Interpolation',
          code: `withCredentials([string(credentialsId: 'MY_SECRET', variable: 'SECRET')]) {
    // Single quotes pass the variable name to bash, letting bash resolve it securely
    sh 'curl -H "Authorization: \${SECRET}" api.com'
}`
        }
      }
    ],
    codeExamples: [],
  },
  'environment-promotion': {
    id: '19-10',
    slug: 'environment-promotion',
    chapterId: 19,
    order: 10,
    title: 'Environment Promotion Strategy',
    description: 'Design robust strategies for promoting code from Staging to Production using GitOps or registry retagging.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.github_actions, technologies.docker, technologies.kubernetes],
    prerequisites: ['19-07'],
    objectives: [
      'Use immutable image tags for promotion',
      'Promote images by retagging in registry',
      'Implement environment-specific configurations',
      'Track which version is deployed where'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'What is Environment Promotion?',
        content: `Once a build is verified in a Staging environment, it needs to be moved to Production. This process is called "Promotion."

A crucial principle is that **you do not re-build the source code to deploy to production.** If you do, you are not deploying the artifact you just tested. Instead, you promote the existing Docker image.

There are two primary patterns for promotion:
1. **Registry Retagging:** The CI pipeline downloads the image tag verified in Staging, applies a new \`production\` tag (or a release version tag), and pushes it back. Production environments pull this new tag.
2. **GitOps (Manifest Update):** The image tag (e.g., the Git SHA) remains unchanged. Instead, a separate Git repository holding Kubernetes manifests is updated. The CI pipeline commits a change to the manifest repo, changing the image target for the Production deployment from SHA-A to SHA-B. Tools like ArgoCD or Flux detect this commit and sync the cluster.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'GitOps Manifest Update Workflow',
        content: `This GitHub Actions workflow demonstrates the GitOps approach. Instead of running \`kubectl apply\` directly, the pipeline updates a YAML file in a separate infrastructure repository and commits the change.

This provides an incredible audit trail: every production deployment is recorded as a Git commit in the infrastructure repo, showing exactly who deployed what version and when.`,
        codeExample: {
          id: 'ga-gitops',
          language: 'yaml',
          title: 'GitOps Promotion',
          filename: '.github/workflows/promote.yml',
          code: `name: Promote to Production (GitOps)

on:
  workflow_dispatch:
    inputs:
      image_sha:
        description: 'Git SHA to promote to production'
        required: true
        type: string

jobs:
  update-manifests:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout the INFRASTRUCTURE repository (not the app repo)
      - name: Checkout Infra Repo
        uses: actions/checkout@v4
        with:
          repository: myorg/infrastructure-k8s
          token: \${{ secrets.GITOPS_PAT }} # Personal Access Token needed to push to other repo
          path: infra

      # 2. Update the image tag in the production Kustomize/Helm file
      - name: Update Image Tag
        run: |
          cd infra/apps/fastapi-app/overlays/production
          # Using sed to replace the image tag in a deployment.yaml
          # Or using kustomize edit if using Kustomize
          kustomize edit set image myapi=ghcr.io/myorg/myapp:\${{ github.event.inputs.image_sha }}

      # 3. Commit and Push the change
      - name: Commit and Push
        run: |
          cd infra
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Promote fastapi-app to \${{ github.event.inputs.image_sha }} in Production"
          git push origin main`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Configuration Segregation',
        content: `When promoting the identical Docker image across environments, the application must behave differently (connecting to staging DB vs prod DB). This is achieved via environment variables injected by the orchestrator (Kubernetes ConfigMaps/Secrets), completely externalizing configuration from the immutable image artifact. FastAPI's Pydantic \`BaseSettings\` reads these seamlessly at startup.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Describe the GitOps approach to Continuous Deployment.',
        answer: 'GitOps uses a Git repository as the single source of truth for declarative infrastructure and applications. Instead of CI pipelines pushing changes to the cluster directly, the pipeline updates manifests in Git. A controller inside the cluster (like ArgoCD) continuously monitors Git and pulls changes to synchronize the cluster state.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'Why is rebuilding a Docker image for production considered a bad practice?',
        answer: 'Rebuilding introduces the risk of changes. A dependency update, a new base OS layer, or a transient network failure could result in a production image that is subtly different from the one thoroughly tested in staging, invalidating all previous tests.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'When using GitOps, ensure your CI pipeline waits for the GitOps controller (e.g., ArgoCD) to complete the sync before marking the deployment as fully successful and running smoke tests.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Untraceable Outage',
        problem: 'Production went down, but looking at the application repository, no code had been merged in days. It turned out someone ran `kubectl edit` manually to change an environment variable, leaving no audit trail.',
        solution: 'The team moved to GitOps. Direct cluster access was revoked. All configuration changes must be made via PRs to the infrastructure repository, ensuring peer review and a complete Git history of state changes.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Registry Retagging using Docker CLI',
        description: 'Write a script (or GitHub Actions step) that promotes an image by downloading the `staging` tag and pushing it as the `production` tag without rebuilding it.',
        hint: 'Use `docker pull`, `docker tag`, and `docker push`.',
        solution: 'Pull the staging image, tag it with prod, and push.',
        solutionCode: {
          id: 'sol-1',
          language: 'bash',
          title: 'Promote Tag',
          filename: 'promote.sh',
          code: `#!/bin/bash
# 1. Pull verified staging image
docker pull ghcr.io/myorg/myapp:staging

# 2. Apply production tag to the local image
docker tag ghcr.io/myorg/myapp:staging ghcr.io/myorg/myapp:production

# 3. Push the newly tagged image back to registry
docker push ghcr.io/myorg/myapp:production`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Configuration baked into Image',
        description: 'Copying a `.env.production` file into the Docker image during the build process.',
        badCode: {
          id: 'bad-1',
          language: 'dockerfile',
          title: '❌ Baked Config',
          code: `COPY .env.production .env
CMD ["uvicorn", "app.main:app"]`
        },
        goodCode: {
          id: 'good-1',
          language: 'yaml',
          title: '✅ External Config (K8s)',
          code: `# Kubernetes Deployment Manifest
envFrom:
  - configMapRef:
      name: myapp-config-prod`
        }
      }
    ],
    codeExamples: [],
  },
  'pipeline-observability': {
    id: '19-11',
    slug: 'pipeline-observability',
    chapterId: 19,
    order: 11,
    title: 'Pipeline Observability & DORA Metrics',
    description: 'Measure and improve your engineering velocity by tracking DORA metrics derived from CI/CD data.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.github_actions, technologies.prometheus],
    prerequisites: ['19-01', '19-07'],
    objectives: [
      'Measure deployment frequency from CI data',
      'Calculate lead time from commit to production',
      'Track MTTR from incident to recovery',
      'Use DORA metrics to improve engineering'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Engineering Velocity and DORA',
        content: `CI/CD pipelines generate a wealth of metadata. By analyzing this data, teams can measure their engineering velocity and reliability. The industry standard for this measurement is the **DORA (DevOps Research and Assessment) metrics**:

1. **Deployment Frequency:** How often does the organization deploy code to production? (Higher is better, indicates small, frequent, less risky releases).
2. **Lead Time for Changes:** How long does it take to go from code committed to code successfully running in production? (Lower is better, indicates fast pipeline and review processes).
3. **Change Failure Rate:** What percentage of deployments cause a failure in production requiring remediation? (Lower is better, indicates high code quality and test coverage).
4. **Time to Restore Service (MTTR):** How long does it take to recover from a failure in production? (Lower is better, indicates robust rollback and monitoring systems).`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Collecting Metrics from GitHub Actions',
        content: `GitHub provides APIs to extract workflow run times, success/failure statuses, and deployment events. Advanced teams extract this data (often using Webhooks triggered on workflow completion) and push it to observability platforms like Datadog, Prometheus, or custom Grafana dashboards.

By visualizing Lead Time, a team might discover that their automated tests take 5 minutes, but code reviews take 3 days, indicating that optimizing the CI pipeline won't solve the real bottleneck.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Exporting Metrics to Datadog',
        content: `This snippet demonstrates adding a step to your deployment workflow to explicitly log a deployment event to an external observability system (like Datadog). This specific event can then be charted to measure Deployment Frequency and correlate deployments with CPU/Memory spikes in production.`,
        codeExample: {
          id: 'ga-metrics',
          language: 'yaml',
          title: 'Sending Deployment Events',
          filename: '.github/workflows/deploy.yml',
          code: `      # After successful deployment...
      - name: Send Deployment Event to Datadog
        uses: DataDog/datadog-actions/datadog-event@v2
        with:
          api_key: \${{ secrets.DD_API_KEY }}
          title: "Deployed fastapi-api to Production"
          text: "Version \${{ github.sha }} was deployed successfully by \${{ github.actor }}"
          tags: |
            env:production
            service:fastapi-api
            version:\${{ github.sha }}
          alert_type: "success"`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What are the four DORA metrics and why are they important?',
        answer: 'Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Time to Restore Service. They provide an objective, data-driven way to measure software delivery performance, balancing speed (Frequency/Lead Time) with stability (Failure Rate/MTTR).',
        difficulty: 'advanced'
      },
      {
        id: 'iq-2',
        question: 'How can a CI/CD pipeline help improve Mean Time To Recovery (MTTR)?',
        answer: 'By providing automated, one-click rollback mechanisms (re-deploying previous immutable image tags) and integrating automated smoke tests that catch failures immediately post-deployment, halting rollouts before users are broadly affected.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'Don\'t use DORA metrics to punish developers. Use them to identify systemic bottlenecks, like overly burdensome change approval boards or flaky test suites that slow down the entire team.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-1',
        scenario: 'The Perception vs Reality Gap',
        problem: 'Engineering leadership believed the team was agile because they merged PRs daily. However, DORA metrics revealed the "Lead Time for Changes" was actually 14 days.',
        solution: 'Data showed that while PRs merged quickly, deployments to production were batched bi-weekly due to a manual QA process. The team used this data to justify investing in automated integration tests, allowing them to move to daily deployments.'
      }
    ],
    challenges: [
      {
        id: 'ch-1',
        title: 'Calculating Lead Time',
        description: 'A commit is pushed at 10:00 AM. It passes tests at 10:10 AM. It is merged at 1:00 PM. The CI pipeline builds the artifact by 1:10 PM. The manual approval for production is clicked at 3:00 PM. It is live at 3:05 PM. What is the Lead Time for this change?',
        hint: 'Lead time is from initial commit to running in production.',
        solution: 'From 10:00 AM (commit) to 3:05 PM (live in production). The lead time is 5 hours and 5 minutes.',
        solutionCode: {
          id: 'sol-1',
          language: 'markdown',
          title: 'Calculation',
          filename: 'calculation.txt',
          code: `Start: 10:00 AM
End: 03:05 PM
Total Lead Time: 5 hours, 5 minutes. 
(Note: Optimizing the 10-minute build process won't help much here; the 3-hour PR review and 2-hour manual approval wait time are the true bottlenecks.)`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Optimizing the wrong metric',
        description: 'Spending weeks reducing pipeline execution time from 5 minutes to 2 minutes, when the actual lead time bottleneck is a mandatory 48-hour Change Advisory Board (CAB) approval process.',
        badCode: {
          id: 'bad-1',
          language: 'markdown',
          title: '❌ Micro-optimizing',
          code: `Focusing entirely on pipeline speed while ignoring organizational delays.`
        },
        goodCode: {
          id: 'good-1',
          language: 'markdown',
          title: '✅ Systems Thinking',
          code: `Mapping the entire value stream from idea to production to find the true largest constraint.`
        }
      }
    ],
    codeExamples: [],
  }
};
