import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch10Lessons: Record<string, Lesson> = {
  'celery-architecture': {
    id: '10-01',
    slug: 'celery-architecture',
    chapterId: 10,
    order: 1,
    title: 'Celery Architecture Deep Dive',
    description: 'Understand the producer-broker-worker architecture behind Celery.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.redis],
    prerequisites: [],
    objectives: [
      'Explain Celery producer-broker-worker architecture',
      'Compare Redis vs RabbitMQ as brokers',
      'Configure result backends for task status',
      'Understand task serialization formats'
    ],
    sections: [
      {
        id: 'sec-10-01-1',
        type: 'concept',
        title: 'The Producer-Broker-Worker Triad',
        content: `Celery operates on a distributed message passing model, decoupling the submission of a task from its execution. This is essential in web applications where long-running operations (like sending emails, processing images, or calling third-party APIs) would otherwise block the HTTP response.

The architecture consists of three primary components:
1. **Producer**: Your FastAPI application that creates and sends tasks.
2. **Broker**: The message queue (like Redis or RabbitMQ) that temporarily stores tasks until a worker is ready.
3. **Worker**: A separate process (or pool of processes) that continuously polls the broker for new tasks and executes them.
4. **Result Backend (Optional)**: A storage system (often the same Redis instance, or a SQL database) to keep the state and result of tasks once they finish.

Understanding this triad is crucial because misconfigurations in any part can lead to lost tasks, delayed processing, or out-of-memory errors.`,
      },
      {
        id: 'sec-10-01-2',
        type: 'architecture',
        title: 'Choosing a Broker and Backend',
        content: `While Celery supports many brokers, **RabbitMQ** and **Redis** are the most common. RabbitMQ is a full-featured AMQP message broker, offering robust routing and guaranteed delivery. Redis is an in-memory data store that is incredibly fast and simple to set up, but lacks some advanced message queueing features natively.

For the **Result Backend**, Redis is typically used for transient task results that don't need to be kept permanently. If you need a permanent audit trail of task results, a SQL database via SQLAlchemy is a better choice.`,
        codeExample: {
          id: 'code-10-01-1',
          language: 'python',
          title: 'Basic Celery Configuration',
          filename: 'celery_app.py',
          code: `from celery import Celery

# Initialize Celery app
# Using Redis as both broker and result backend
celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task
def dummy_task():
    return "Architecture set up!"
`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-01',
        title: 'Configure a Secure Celery Setup',
        description: 'Configure Celery to use Redis on port 6379 as the broker, but explicitly set the task serializer to JSON and ignore results by default to save memory.',
        hint: 'Use celery_app.conf.update with task_ignore_result=True.',
        solution: 'Setting task_ignore_result ensures the result backend isn\'t flooded with useless states.',
        solutionCode: {
          id: 'sol-10-01',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `from celery import Celery

app = Celery('secure_tasks', broker='redis://localhost:6379/0')
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    task_ignore_result=True
)
`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-01-1',
        question: 'What is the difference between a message broker and a result backend in Celery?',
        answer: 'The broker is responsible for queuing and delivering messages (task requests) from the producer to the worker. The result backend is an optional storage where workers save the final output or current state (e.g., PENDING, SUCCESS, FAILURE) of a task for the producer to retrieve later.',
        difficulty: 'intermediate'
      },
      {
        id: 'int-10-01-2',
        question: 'Why is JSON preferred over Pickle for task serialization in modern Celery?',
        answer: 'Pickle can execute arbitrary code during deserialization, posing a severe security risk if the message broker is compromised or accessible. JSON is secure, language-agnostic, and easily readable, though it cannot serialize complex Python objects natively.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-01',
        severity: 'critical',
        content: 'Never expose your Redis or RabbitMQ broker to the public internet. If a malicious actor accesses the broker, they can inject arbitrary tasks or read sensitive data.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'fastapi-celery-integration': {
    id: '10-02',
    slug: 'fastapi-celery-integration',
    chapterId: 10,
    order: 2,
    title: 'Integrating Celery with FastAPI',
    description: 'Learn how to trigger Celery tasks from FastAPI endpoints and track their status.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.fastapi],
    prerequisites: ['10-01'],
    objectives: [
      'Initialize Celery app with FastAPI config',
      'Submit tasks from FastAPI endpoints',
      'Return task IDs for polling',
      'Check task status via API endpoint'
    ],
    sections: [
      {
        id: 'sec-10-02-1',
        type: 'concept',
        title: 'Asynchronous Workflows in REST APIs',
        content: `When a client makes a request that requires heavy processing, returning the result immediately is often impossible without causing a timeout. The standard pattern is to accept the request, enqueue a background task, and return a "202 Accepted" status along with a unique identifier (Task ID).

The client can then periodically poll a separate endpoint using this Task ID to check the status (e.g., PENDING, PROGRESS, SUCCESS, FAILURE) and retrieve the result when it's ready.

Integrating Celery with FastAPI requires careful project structuring to ensure the Celery worker and the FastAPI server share the same task definitions and configurations.`
      },
      {
        id: 'sec-10-02-2',
        type: 'implementation',
        title: 'Project Structure and Endpoints',
        content: `We structure our project so both the FastAPI app and Celery worker can import the necessary modules. We use \`delay()\` or \`apply_async()\` to enqueue tasks.`,
        codeExample: {
          id: 'code-10-02-1',
          title: 'FastAPI Celery Integration',
          files: {
            'app/core/celery_app.py': {
              language: 'python',
              code: `from celery import Celery

celery_app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1"
)

celery_app.conf.task_routes = {"app.tasks.*": "main-queue"}`
            },
            'app/tasks/process.py': {
              language: 'python',
              code: `import time
from app.core.celery_app import celery_app

@celery_app.task(bind=True)
def heavy_processing_task(self, data: dict):
    # Simulate heavy work
    for i in range(5):
        time.sleep(1)
        # Update custom state
        self.update_state(state='PROGRESS', meta={'current': i, 'total': 5})
    return {"status": "completed", "result": f"Processed {data}"}`
            },
            'app/api/endpoints.py': {
              language: 'python',
              code: `from fastapi import APIRouter
from celery.result import AsyncResult
from app.tasks.process import heavy_processing_task

router = APIRouter()

@router.post("/process/")
async def process_data(payload: dict):
    # Dispatch task to Celery
    task = heavy_processing_task.delay(payload)
    return {"task_id": task.id, "message": "Task accepted"}

@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    task_result = AsyncResult(task_id)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
    }
    
    if task_result.status == 'SUCCESS':
        response['result'] = task_result.result
    elif task_result.status == 'PROGRESS':
        response['meta'] = task_result.info
        
    return response`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-02',
        title: 'Handle Task Failures in Polling',
        description: 'Update the status endpoint to handle task failures and return a 500 error detailing the exception if the task state is FAILURE.',
        hint: 'Check if task_result.status == "FAILURE" and stringify task_result.result, which holds the exception.',
        solution: 'Proper error handling ensures clients know when a background job has failed.',
        solutionCode: {
          id: 'sol-10-02',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `from fastapi import HTTPException

@router.get("/status/{task_id}")
async def get_status(task_id: str):
    task = AsyncResult(task_id)
    if task.status == 'FAILURE':
        raise HTTPException(status_code=500, detail=str(task.result))
    return {"status": task.status, "result": task.result if task.ready() else None}
`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-02-1',
        question: 'Why should you return a 202 Accepted status for async processing rather than waiting for the Celery task to finish?',
        answer: 'Returning 202 frees up the FastAPI worker to handle other incoming requests immediately. Waiting for the task to finish synchronously would block the worker thread, reducing throughput and potentially leading to gateway timeouts.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-02',
        severity: 'warning',
        content: 'When using AsyncResult in an API endpoint, ensure that the user requesting the status actually owns the task, otherwise you risk exposing sensitive data from other users\' background jobs.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'task-design-patterns': {
    id: '10-03',
    slug: 'task-design-patterns',
    chapterId: 10,
    order: 3,
    title: 'Task Design Patterns',
    description: 'Design robust, atomic, and composable Celery tasks using signatures, groups, and chains.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.python],
    prerequisites: ['10-02'],
    objectives: [
      'Keep tasks small and single-purpose',
      'Make tasks idempotent for safe retries',
      'Use chains for sequential processing',
      'Use groups for parallel processing'
    ],
    sections: [
      {
        id: 'sec-10-03-1',
        type: 'concept',
        title: 'Idempotency and Granularity',
        content: `A golden rule of distributed task queues is that tasks must be **idempotent**. Idempotency means that executing a task multiple times yields the same result as executing it once. This is critical because network partitions or worker crashes can cause tasks to be retried automatically. If a task charges a credit card, retrying it blindly will double-charge the user.

To achieve idempotency, tasks should rely on database state to verify if work has already been done. Additionally, tasks should be small and single-purpose. Rather than one massive monolithic task that fetches data, processes it, and sends an email, break it into three distinct tasks.`
      },
      {
        id: 'sec-10-03-2',
        type: 'implementation',
        title: 'Chains, Groups, and Chords',
        content: `Celery provides primitives called Canvas for composing tasks:
- **Signatures**: A task object that can be passed around before execution.
- **Chain**: Executes tasks sequentially, passing the result of one to the next.
- **Group**: Executes a list of tasks in parallel.
- **Chord**: Executes a group in parallel, then executes a callback task when all are finished.`,
        codeExample: {
          id: 'code-10-03-1',
          language: 'python',
          title: 'Celery Canvas Workflow',
          filename: 'workflows.py',
          code: `from celery import chain, group, chord
from app.core.celery_app import celery_app

@celery_app.task
def fetch_user_data(user_id: int):
    return {"user_id": user_id, "data": "raw"}

@celery_app.task
def generate_report(user_data: dict):
    user_data['report'] = 'generated'
    return user_data

@celery_app.task
def send_email(report_data: dict):
    # Idempotency check: only send if not sent
    print(f"Sending email for user {report_data['user_id']}")
    return True

@celery_app.task
def summarize_all(results: list):
    return f"Processed {len(results)} reports successfully."

# 1. CHAIN: Sequential processing
def process_single_user(user_id: int):
    # fetch -> generate -> email
    workflow = chain(
        fetch_user_data.s(user_id),
        generate_report.s(),
        send_email.s()
    )
    return workflow.delay()

# 2. CHORD: Parallel processing with callback
def process_multiple_users(user_ids: list):
    # Run all users in parallel, then summarize
    workflow = chord(
        (chain(fetch_user_data.s(uid), generate_report.s()) for uid in user_ids),
        summarize_all.s()
    )
    return workflow.delay()`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-03',
        title: 'Implement an Idempotent Task',
        description: 'Write a Celery task that processes a payment. It should take a transaction_id, query a dummy database function check_transaction(id), and skip processing if already paid.',
        hint: 'Return early if the transaction is already marked as paid.',
        solution: 'Idempotency prevents duplicate charges if the task gets retried by the broker.',
        solutionCode: {
          id: 'sol-10-03',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `
def check_transaction(tx_id): return False # Mock

@celery_app.task
def process_payment(tx_id: str, amount: float):
    if check_transaction(tx_id):
        return {"status": "skipped", "reason": "Already processed"}
    
    # Process payment here
    return {"status": "success", "tx_id": tx_id}
`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-03-1',
        question: 'What is a Celery Signature?',
        answer: 'A signature (or subtask) wraps the arguments, keyword arguments, and execution options of a single task invocation in a way that it can be passed to other functions or serialized. It allows for lazy evaluation and is the building block for Canvas workflows like groups and chains.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-03',
        severity: 'info',
        content: 'When using Groups or Chords, the result backend MUST be configured. Otherwise, Celery has no way to coordinate the completion of the parallel tasks.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'retry-exponential-backoff': {
    id: '10-04',
    slug: 'retry-exponential-backoff',
    chapterId: 10,
    order: 4,
    title: 'Retries & Exponential Backoff',
    description: 'Master error handling in distributed systems using automatic retries with exponential backoff and jitter.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.python],
    prerequisites: ['10-03'],
    objectives: [
      'Configure max_retries and retry_backoff',
      'Add jitter to prevent retry thundering herd',
      'Handle specific exceptions vs catching all',
      'Test retry behavior with failure injection'
    ],
    sections: [
      {
        id: 'sec-10-04-1',
        type: 'concept',
        title: 'The Reality of Distributed Failures',
        content: `In any distributed system, temporary failures are guaranteed. Third-party APIs rate limit you, databases undergo split-second failovers, and network packets get dropped. Failing a background task permanently because of a transient error is brittle.

Instead, we use **Retries**. However, if all failing tasks retry immediately, they can cause a "thundering herd" effect, overwhelming the recovering service. To mitigate this, we use **Exponential Backoff** (waiting progressively longer between retries) and **Jitter** (adding random variance to the delay).`
      },
      {
        id: 'sec-10-04-2',
        type: 'implementation',
        title: 'Configuring Automatic Retries',
        content: `Celery allows automatic retries on specific exceptions. We can configure the backoff and jitter at the task decorator level.`,
        codeExample: {
          id: 'code-10-04-1',
          language: 'python',
          title: 'Task Retry Configuration',
          filename: 'tasks.py',
          code: `import requests
from requests.exceptions import RequestException
from app.core.celery_app import celery_app

# Autoretry on specific exceptions
@celery_app.task(
    bind=True,
    autoretry_for=(RequestException,),
    retry_kwargs={'max_retries': 5},
    retry_backoff=True,       # 1s, 2s, 4s, 8s, 16s...
    retry_backoff_max=600,    # Max delay 10 minutes
    retry_jitter=True         # Add random jitter
)
def call_flaky_api(self, payload: dict):
    response = requests.post("https://api.flaky-service.com/data", json=payload)
    
    if response.status_code == 429:
        # Explicit retry if rate limited
        raise self.retry(exc=Exception("Rate Limited"), countdown=60)
        
    response.raise_for_status()
    return response.json()`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-04',
        title: 'Implement Custom Backoff Logic',
        description: 'Sometimes you want to explicitly control the retry countdown based on the current retry count. Implement a manual retry block catching a ValueError that calculates countdown as 2 ** self.request.retries.',
        hint: 'Use a try-except block, and call raise self.retry(exc=e, countdown=delay).',
        solution: 'Manual retries give you absolute control over the backoff algorithm.',
        solutionCode: {
          id: 'sol-10-04',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `@celery_app.task(bind=True, max_retries=3)
def manual_retry_task(self):
    try:
        raise ValueError("Oops")
    except ValueError as e:
        delay = 2 ** self.request.retries
        raise self.retry(exc=e, countdown=delay)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-04-1',
        question: 'What is "Jitter" in the context of retries, and why is it important?',
        answer: 'Jitter adds randomness to the backoff delay. Without jitter, if a service goes down, hundreds of tasks might fail simultaneously and then retry at the exact same exponential intervals (e.g., all retry at 2s, then 4s, then 8s), causing spikes in traffic (thundering herd). Jitter spreads these retries out over time.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-04',
        severity: 'warning',
        content: 'Never catch generic Exception for autoretry_for. This will cause tasks that fail due to programming errors (like TypeError or KeyError) to be retried, wasting resources and polluting logs.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-10-04',
        scenario: 'Third-Party Outage',
        problem: 'A webhook provider went down for 30 minutes. Thousands of webhook tasks failed and were discarded because max_retries was set to 3 with no backoff.',
        solution: 'Implemented exponential backoff up to a max of 2 hours, allowing the tasks to patiently wait in the queue until the provider recovered, resulting in zero data loss.'
      }
    ],
    commonMistakes: [],
    codeExamples: [],
  },
  'dead-letter-queues': {
    id: '10-05',
    slug: 'dead-letter-queues',
    chapterId: 10,
    order: 5,
    title: 'Dead-Letter Queues',
    description: 'Safely handle tasks that exhaust their retries by routing them to a Dead Letter Queue (DLQ).',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.redis, technologies.rabbitmq],
    prerequisites: ['10-04'],
    objectives: [
      'Configure dead-letter queue for failed tasks',
      'Inspect failed tasks in Flower or CLI',
      'Replay dead-letter tasks after fixing the bug',
      'Alert on dead-letter queue growth'
    ],
    sections: [
      {
        id: 'sec-10-05-1',
        type: 'concept',
        title: 'What Happens When All Retries Fail?',
        content: `Even with exponential backoff, some tasks will inevitably exhaust their maximum retries. By default, Celery logs an error and drops the task. If this task was a critical business operation (like processing a refund), losing it is catastrophic.

A Dead-Letter Queue (DLQ) is a dedicated message queue where permanently failed messages are routed. Developers can then inspect the DLQ, identify the bug or data issue, fix it, and **replay** the tasks from the DLQ back into the main queue.`
      },
      {
        id: 'sec-10-05-2',
        type: 'architecture',
        title: 'DLQ with RabbitMQ vs Redis',
        content: `If you are using RabbitMQ as your broker, DLQs can be handled natively by configuring exchange policies (\`x-dead-letter-exchange\`). RabbitMQ will automatically move rejected messages.

If using Redis, Celery doesn't have native, robust DLQ support built-in at the broker level. You typically have to implement this at the application level using Celery's task routing and error handling signals (e.g., \`task_failure\` signal) to explicitly enqueue a new task into a "dead-letter" Redis queue.`,
        codeExample: {
          id: 'code-10-05-1',
          language: 'python',
          title: 'Application-level DLQ with Signals',
          filename: 'dlq_handler.py',
          code: `from celery.signals import task_failure
from app.core.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None, 
                        args=None, kwargs=None, traceback=None, einfo=None, **other):
    """
    Catches ALL permanent task failures across the application.
    """
    logger.error(f"Task {sender.name} [{task_id}] permanently failed.")
    
    # Send the failed payload to a dedicated DLQ task or database table
    try:
        celery_app.send_task(
            'app.tasks.dlq.store_failed_task',
            args=[sender.name, task_id, str(exception), args, kwargs],
            queue='dead_letters'
        )
    except Exception as e:
        logger.critical(f"Failed to route to DLQ: {e}")`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-05',
        title: 'Define the DLQ Storage Task',
        description: 'Write the store_failed_task function that takes the failed task details and logs them as a warning.',
        hint: 'Use the @celery_app.task decorator and log the arguments.',
        solution: 'This serves as the receiver for the failure signal.',
        solutionCode: {
          id: 'sol-10-05',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `import logging
logger = logging.getLogger(__name__)

@celery_app.task
def store_failed_task(task_name, task_id, error, args, kwargs):
    logger.warning(f"DLQ Logged: {task_name} - Error: {error}")
    # In reality, save this to Postgres or an alerting system.
`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-05-1',
        question: 'How do Dead Letter Queues prevent infinite retry loops?',
        answer: 'Instead of keeping a problematic task in the main queue forever—which consumes worker resources and delays healthy tasks—the DLQ isolates the poison pill. It removes the task from active rotation while preserving the payload so human intervention can occur.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-05',
        severity: 'critical',
        content: 'You must implement monitoring and alerting (e.g., via Prometheus/Grafana) on the size of your DLQ. A growing DLQ indicates a systemic failure in your application.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'celery-beat-scheduling': {
    id: '10-06',
    slug: 'celery-beat-scheduling',
    chapterId: 10,
    order: 6,
    title: 'Celery Beat: Scheduled & Periodic Tasks',
    description: 'Use Celery Beat to execute background tasks on a schedule, like cron jobs.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.redis],
    prerequisites: ['10-02'],
    objectives: [
      'Configure Celery Beat schedules',
      'Use crontab and timedelta schedules',
      'Prevent duplicate task execution with locking',
      'Monitor Beat task execution history'
    ],
    sections: [
      {
        id: 'sec-10-06-1',
        type: 'concept',
        title: 'Replacing Cron with Celery Beat',
        content: `Many web applications need periodic maintenance: sending daily summary emails, clearing expired database sessions, or generating weekly reports. While traditional Unix \`cron\` works, it is tied to a single machine and hard to manage in distributed, containerized environments.

**Celery Beat** is a scheduler process that kicks off tasks at regular intervals, dropping them into the broker for workers to execute. It allows you to define schedules in Python code, keeping your infrastructure configuration centralized.`
      },
      {
        id: 'sec-10-06-2',
        type: 'implementation',
        title: 'Configuring Beat Schedules',
        content: `You can configure Beat schedules using simple timers (every X seconds) or crontab-like syntax (e.g., every Monday at 8 AM).`,
        codeExample: {
          id: 'code-10-06-1',
          language: 'python',
          title: 'Celery Beat Configuration',
          filename: 'celery_app.py',
          code: `from celery import Celery
from celery.schedules import crontab

celery_app = Celery("worker", broker="redis://localhost:6379/0")

celery_app.conf.beat_schedule = {
    # Executes every 30 seconds
    'cleanup-sessions-every-30-seconds': {
        'task': 'app.tasks.periodic.cleanup_sessions',
        'schedule': 30.0,
    },
    # Executes every Monday morning at 7:30 a.m.
    'send-weekly-report': {
        'task': 'app.tasks.reports.send_weekly_summary',
        'schedule': crontab(hour=7, minute=30, day_of_week=1),
        'args': ('admin@example.com',),
    },
}`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-06',
        title: 'Schedule a Midnight Task',
        description: 'Add a new schedule to execute app.tasks.billing.calculate_invoices exactly at midnight every day.',
        hint: 'Use crontab(hour=0, minute=0).',
        solution: 'Crontab syntax in Celery maps closely to standard Unix cron.',
        solutionCode: {
          id: 'sol-10-06',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `'daily-billing': {
    'task': 'app.tasks.billing.calculate_invoices',
    'schedule': crontab(hour=0, minute=0),
}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-06-1',
        question: 'Why must you run exactly one instance of the Celery Beat process, even if you have many Celery workers?',
        answer: 'Celery Beat is just a scheduler that enqueues tasks. If you run multiple instances of Beat, they will all try to evaluate the schedule and will enqueue duplicate tasks, leading to the same periodic job being executed multiple times.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-06',
        severity: 'critical',
        content: 'Ensure timezone handling is configured correctly in Celery (enable_utc=True). Mismatched timezones between Beat and Workers can cause tasks to run at unexpected times.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'task-priorities-routing': {
    id: '10-07',
    slug: 'task-priorities-routing',
    chapterId: 10,
    order: 7,
    title: 'Task Priorities & Queue Routing',
    description: 'Ensure critical tasks execute instantly by routing tasks to dedicated queues and workers.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.redis],
    prerequisites: ['10-02'],
    objectives: [
      'Create dedicated queues for different task types',
      'Route tasks to appropriate queues',
      'Configure worker concurrency per queue',
      'Implement priority queues for urgent tasks'
    ],
    sections: [
      {
        id: 'sec-10-07-1',
        type: 'concept',
        title: 'The "Noisy Neighbor" Problem',
        content: `If you have one default queue for all tasks, you risk a "noisy neighbor" scenario. Imagine you have a fast, user-facing task (like sending a password reset email) and a slow, background task (like generating a 5GB data export). 

If a user requests 100 data exports, the queue fills up. When another user requests a password reset, that urgent task gets stuck behind 100 slow tasks, causing unacceptable latency. 

The solution is **Routing**: defining multiple queues (e.g., \`high_priority\`, \`default\`, \`heavy_compute\`) and assigning dedicated worker processes to consume exclusively from specific queues.`
      },
      {
        id: 'sec-10-07-2',
        type: 'implementation',
        title: 'Configuring Task Routes',
        content: `You can route tasks based on their module name or define explicit routes.`,
        codeExample: {
          id: 'code-10-07-1',
          language: 'python',
          title: 'Routing Configuration',
          filename: 'celery_app.py',
          code: `from celery import Celery
from kombu import Queue

celery_app = Celery("worker", broker="redis://localhost:6379/0")

# Define available queues
celery_app.conf.task_queues = (
    Queue('default', routing_key='task.#'),
    Queue('emails', routing_key='email.#'),
    Queue('heavy_compute', routing_key='compute.#'),
)

# Route specific tasks to specific queues
celery_app.conf.task_routes = {
    'app.tasks.email.*': {'queue': 'emails'},
    'app.tasks.reports.generate_pdf': {'queue': 'heavy_compute'},
    # All others go to default
}

# When starting workers, specify the queues they consume:
# celery -A app.core.celery_app worker -Q emails -c 10
# celery -A app.core.celery_app worker -Q heavy_compute -c 2`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-07',
        title: 'Dynamic Routing at Runtime',
        description: 'Sometimes you want to decide the queue at runtime. Submit a task named app.tasks.process using .apply_async(), and force it to go to the "urgent" queue.',
        hint: 'Use the queue argument in apply_async.',
        solution: 'Overriding routes at runtime allows for fine-grained priority control.',
        solutionCode: {
          id: 'sol-10-07',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `from app.tasks import process
# Dispatch directly to urgent queue
process.apply_async(args=[data], queue='urgent')`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-07-1',
        question: 'Why use different queues instead of just setting the Celery task priority (0-9)?',
        answer: 'Redis does not natively support strict priority queueing as well as RabbitMQ does. Furthermore, even with priorities, if all worker threads are actively busy processing long, low-priority tasks, a high-priority task still has to wait until a worker is free. Dedicated queues with dedicated workers guarantee isolated resources.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-07',
        severity: 'info',
        content: 'When setting up dedicated queues, ensure your default worker still listens to the default queue. Otherwise, unrouted tasks will pile up and never execute.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'worker-concurrency': {
    id: '10-08',
    slug: 'worker-concurrency',
    chapterId: 10,
    order: 8,
    title: 'Worker Concurrency Models',
    description: 'Optimize Celery performance by choosing the right concurrency model (Prefork, Gevent, Eventlet).',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.docker, technologies.kubernetes],
    prerequisites: ['10-01'],
    objectives: [
      'Choose concurrency model for I/O vs CPU tasks',
      'Configure worker autoscaling',
      'Monitor worker resource usage',
      'Scale workers horizontally in Kubernetes'
    ],
    sections: [
      {
        id: 'sec-10-08-1',
        type: 'concept',
        title: 'CPU-Bound vs I/O-Bound Work',
        content: `Celery workers can execute multiple tasks concurrently. The default execution pool is **Prefork** (multiprocessing), which spins up a Python process per CPU core. This is ideal for CPU-bound tasks like image processing or complex calculations because it bypasses the Python Global Interpreter Lock (GIL).

However, if your tasks are primarily I/O-bound (making HTTP requests to external APIs, waiting for database queries), Prefork is extremely inefficient. A worker might block for 2 seconds waiting for an HTTP response, doing zero actual CPU work. In these cases, asynchronous pools like **Gevent** or **Eventlet** (green threads) allow a single CPU core to handle hundreds or thousands of concurrent I/O-bound tasks.`
      },
      {
        id: 'sec-10-08-2',
        type: 'architecture',
        title: 'Execution Pools and Autoscaling',
        content: `Choosing the right pool flag when starting the worker is vital for high throughput. You can also configure autoscaling so Celery adjusts concurrency based on load.

- \`--pool=prefork\` (Default): Good for CPU heavy.
- \`--pool=gevent\`: Good for heavy Network I/O.
- \`--autoscale=10,3\`: Dynamically scale between 3 and 10 processes.`,
        codeExample: {
          id: 'code-10-08-1',
          language: 'bash',
          title: 'Worker Start Commands',
          filename: 'start_workers.sh',
          code: `#!/bin/bash

# Start a prefork worker for heavy computation tasks, matching CPU cores
celery -A app.core.celery_app worker -Q heavy_compute --pool=prefork --concurrency=4 -n compute@%h

# Start a gevent worker for API calls, handling massive concurrency
celery -A app.core.celery_app worker -Q api_calls --pool=gevent --concurrency=500 -n io_worker@%h

# Start a default worker with autoscaling
celery -A app.core.celery_app worker -Q default --autoscale=10,2 -n default@%h`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-08',
        title: 'Select Concurrency Strategy',
        description: 'You have a queue "webhooks" that simply sends POST requests to third parties. Which pool should you use and why?',
        hint: 'HTTP requests are I/O bound.',
        solution: 'Use gevent or eventlet. HTTP POST requests spend 99% of their time waiting for the network, meaning green threads can handle thousands of these concurrently on minimal CPU.',
        solutionCode: {
          id: 'sol-10-08',
          language: 'bash',
          title: 'Solution',
          filename: 'solution.sh',
          code: `celery -A app worker -Q webhooks --pool=gevent -c 1000`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-08-1',
        question: 'What is the Python GIL, and why does Celery default to Prefork (multiprocessing) to get around it?',
        answer: 'The Global Interpreter Lock (GIL) is a mutex in CPython that prevents multiple native threads from executing Python bytecodes at once. Therefore, standard Python threading cannot utilize multiple CPU cores for CPU-bound tasks. Celery uses Prefork to spawn entirely separate OS processes, each with its own GIL and memory space, enabling true parallelism.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-08',
        severity: 'critical',
        content: 'When using Gevent, ensure your Python libraries are "monkey-patched" to be cooperative. If a library blocks using native C extensions, it will block the entire Gevent worker loop.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'task-monitoring-flower': {
    id: '10-09',
    slug: 'task-monitoring-flower',
    chapterId: 10,
    order: 9,
    title: 'Task Monitoring with Flower & Prometheus',
    description: 'Gain deep visibility into your background jobs using Flower and export metrics to Prometheus/Grafana.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.prometheus, technologies.grafana],
    prerequisites: ['10-02'],
    objectives: [
      'Set up Flower for Celery monitoring',
      'Export Celery metrics to Prometheus',
      'Alert on task failure rate',
      'Inspect long-running and stuck tasks'
    ],
    sections: [
      {
        id: 'sec-10-09-1',
        type: 'concept',
        title: 'The Black Box Problem',
        content: `Once a task is handed off to Celery, it can feel like it vanishes into a black box. If tasks fail, if queues back up, or if workers crash, your FastAPI app might remain entirely unaware, leaving users wondering why their emails never arrived.

Monitoring is non-negotiable in production. **Flower** is a web-based tool for monitoring and administrating Celery clusters in real-time. It provides dashboards for task progress, worker status, and queue lengths.`
      },
      {
        id: 'sec-10-09-2',
        type: 'implementation',
        title: 'Running Flower and Prometheus Export',
        content: `Flower can be run as a standalone process pointing to your broker. Additionally, Flower exposes a \`/metrics\` endpoint compatible with Prometheus, allowing you to build robust Grafana dashboards.`,
        codeExample: {
          id: 'code-10-09-1',
          language: 'yaml',
          title: 'Docker Compose setup for Celery and Flower',
          filename: 'docker-compose.yml',
          code: `version: '3.8'
services:
  redis:
    image: redis:alpine
    
  worker:
    build: .
    command: celery -A app.core.celery_app worker --loglevel=info
    depends_on:
      - redis
      
  flower:
    build: .
    command: celery -A app.core.celery_app flower --port=5555
    ports:
      - "5555:5555"
    depends_on:
      - redis
      - worker`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-09',
        title: 'Secure the Flower UI',
        description: 'By default, Flower is completely open. How do you start Flower with basic HTTP authentication?',
        hint: 'Look up the --basic_auth flag for flower.',
        solution: 'Always secure your monitoring endpoints, as they expose application data and worker controls.',
        solutionCode: {
          id: 'sol-10-09',
          language: 'bash',
          title: 'Solution',
          filename: 'start.sh',
          code: `celery -A app.core.celery_app flower --basic_auth=admin:supersecret`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-09-1',
        question: 'Why is it important to monitor queue length in Celery?',
        answer: 'Queue length indicates the backlog of tasks. If the queue length consistently grows, it means the rate of task creation exceeds the rate of processing. This is an early warning sign that you need to horizontally scale your workers before tasks experience unacceptable delays.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-09',
        severity: 'critical',
        content: 'Flower stores task history in memory by default. In high-throughput systems, this will cause Flower to OOM (Out Of Memory) crash. Configure Flower to use a persistent database or limit max_tasks.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'handling-long-tasks': {
    id: '10-10',
    slug: 'handling-long-tasks',
    chapterId: 10,
    order: 10,
    title: 'Handling Long-Running Tasks',
    description: 'Manage tasks that take minutes or hours to complete, including custom progress tracking and cancellations.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.redis],
    prerequisites: ['10-02'],
    objectives: [
      'Track task progress with custom state updates',
      'Implement task cancellation with revoke()',
      'Set hard time limits on tasks',
      'Handle partial completion on timeout'
    ],
    sections: [
      {
        id: 'sec-10-10-1',
        type: 'concept',
        title: 'Progress Tracking and Time Limits',
        content: `When a task runs for 30 minutes (e.g., video encoding), users need visual feedback. Celery allows tasks to update their state mid-execution using \`self.update_state()\`. We can define custom states like "PROGRESS" and attach metadata indicating percentage complete.

Furthermore, long-running tasks are dangerous. A bug could cause an infinite loop, permanently hanging a worker. Celery provides **Soft Limits** (which raise an exception the task can catch to clean up) and **Hard Limits** (which terminate the worker process immediately).`
      },
      {
        id: 'sec-10-10-2',
        type: 'implementation',
        title: 'Progress and Cancellation',
        content: `Here we implement a long task with progress tracking, time limits, and show how a FastAPI endpoint can revoke (cancel) it.`,
        codeExample: {
          id: 'code-10-10-1',
          title: 'Long Tasks and Revocation',
          files: {
            'app/tasks/video.py': {
              language: 'python',
              code: `from app.core.celery_app import celery_app
from celery.exceptions import SoftTimeLimitExceeded
import time

@celery_app.task(bind=True, soft_time_limit=600, time_limit=660)
def encode_video(self, video_id: int):
    try:
        total_chunks = 100
        for i in range(total_chunks):
            # Simulate work
            time.sleep(2)
            
            # Update progress
            self.update_state(
                state='ENCODING',
                meta={'current': i, 'total': total_chunks, 'percent': (i / total_chunks) * 100}
            )
        return {"status": "Complete", "video_id": video_id}
        
    except SoftTimeLimitExceeded:
        # Graceful cleanup
        print(f"Task took too long, cleaning up partial files for {video_id}")
        return {"status": "Timeout", "cleaned_up": True}`
            },
            'app/api/video.py': {
              language: 'python',
              code: `from fastapi import APIRouter
from app.core.celery_app import celery_app

router = APIRouter()

@router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    # Revoke task. terminate=True kills the worker process if it's already running.
    celery_app.control.revoke(task_id, terminate=True, signal='SIGKILL')
    return {"message": f"Task {task_id} cancellation requested."}`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-10',
        title: 'Interpret Task Progress',
        description: 'Write a FastAPI endpoint that checks the status of `encode_video`. If the state is "ENCODING", return the current percentage.',
        hint: 'Check task.state and access task.info.get("percent").',
        solution: 'This allows the frontend to render a progress bar.',
        solutionCode: {
          id: 'sol-10-10',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `@router.get("/progress/{task_id}")
def get_progress(task_id: str):
    task = AsyncResult(task_id)
    if task.state == 'ENCODING':
        return {"progress": task.info.get('percent', 0)}
    return {"status": task.state}`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-10-1',
        question: 'What is the difference between a Soft Time Limit and a Hard Time Limit in Celery?',
        answer: 'A soft time limit raises a `SoftTimeLimitExceeded` exception inside the task code, allowing the task to catch it, clean up resources, and exit gracefully. A hard time limit is enforced at the OS level; the worker process is forcefully killed (SIGKILL), offering no chance for cleanup.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-10',
        severity: 'warning',
        content: 'Using `terminate=True` during revocation is dangerous if the task is writing to a database, as it can cause data corruption or dangling locks. Design tasks to check a cancellation flag in Redis periodically instead of relying on brute-force process killing.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'task-result-patterns': {
    id: '10-11',
    slug: 'task-result-patterns',
    chapterId: 10,
    order: 11,
    title: 'Task Result Patterns',
    description: 'Explore patterns for delivering background job results to the client, moving beyond basic polling.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.fastapi, technologies.websockets],
    prerequisites: ['10-02'],
    objectives: [
      'Implement polling endpoint for task status',
      'Send webhook on task completion',
      'Push task result via WebSocket',
      'Use server-sent events for progress streaming'
    ],
    sections: [
      {
        id: 'sec-10-11-1',
        type: 'concept',
        title: 'Beyond Client Polling',
        content: `The easiest way to get task results is **Polling**: the client hits a GET endpoint every 3 seconds. While easy to implement, it generates massive unnecessary traffic to your API.

Better patterns exist:
1. **Webhooks**: When the Celery task finishes, it makes an HTTP POST request back to a client-specified URL with the result.
2. **WebSockets**: The FastAPI server holds a bidirectional connection with the frontend. The Celery task publishes a message to a Redis Pub/Sub channel upon completion, and the FastAPI WebSocket handler pushes that event to the specific client in real-time.`
      },
      {
        id: 'sec-10-11-2',
        type: 'architecture',
        title: 'Real-Time Updates via WebSockets and Redis Pub/Sub',
        content: `Because FastAPI and Celery run in separate processes, they cannot easily share state. To push a websocket event from a Celery worker, the worker publishes a message to a Redis channel. FastAPI subscribes to that channel and forwards the message to the WebSocket.`,
        codeExample: {
          id: 'code-10-11-1',
          title: 'Pub/Sub WebSocket Integration',
          files: {
            'app/tasks/notify.py': {
              language: 'python',
              code: `import redis
import json
from app.core.celery_app import celery_app

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@celery_app.task
def process_and_notify(user_id: str, data: dict):
    # Do work
    result = {"status": "success", "data": "processed"}
    
    # Publish completion event to Redis channel specific to user
    message = json.dumps({"type": "TASK_COMPLETE", "payload": result})
    redis_client.publish(f"user_notifications_{user_id}", message)
    
    return result`
            },
            'app/api/ws.py': {
              language: 'python',
              code: `from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis
import asyncio

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    
    # Async Redis connection for FastAPI
    redis = await aioredis.from_url("redis://localhost:6379/0")
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"user_notifications_{user_id}")
    
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                data = message["data"].decode("utf-8")
                await websocket.send_text(data)
            await asyncio.sleep(0.1)  # Prevent tight loop
    except WebSocketDisconnect:
        await pubsub.unsubscribe()
        await redis.close()`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-11',
        title: 'Implement Webhook Delivery',
        description: 'Modify the Celery task to accept a `webhook_url`. Instead of publishing to Redis, have the task execute an HTTP POST to the webhook_url with the result using the `requests` library.',
        hint: 'Use requests.post(webhook_url, json=result).',
        solution: 'Webhooks are standard for B2B API integrations where the client is another server.',
        solutionCode: {
          id: 'sol-10-11',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `import requests

@celery_app.task
def process_and_webhook(data: dict, webhook_url: str):
    result = {"status": "success"}
    requests.post(webhook_url, json=result, timeout=5)
    return result`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-11-1',
        question: 'Why can\'t a Celery worker send a message directly to a FastAPI WebSocket client?',
        answer: 'The Celery worker and the FastAPI server run in separate memory spaces (often on completely different servers). The WebSocket connection is held open by the FastAPI process. The Celery worker has no access to that socket object, necessitating an intermediary like Redis Pub/Sub to pass the message across process boundaries.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-11',
        severity: 'info',
        content: 'When implementing polling, encourage clients to use exponential backoff polling (e.g., poll after 1s, then 2s, then 4s). Background jobs rarely finish in a constant time, and aggressive static polling wastes server resources.'
      }
    ],
    realWorldScenarios: [],
    commonMistakes: [],
    codeExamples: [],
  },
  'celery-testing': {
    id: '10-12',
    slug: 'celery-testing',
    chapterId: 10,
    order: 12,
    title: 'Testing Celery Tasks',
    description: 'Learn strategies for unit and integration testing Celery tasks, mocking brokers, and testing asynchronous workflows.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.celery, technologies.pytest, technologies.python],
    prerequisites: ['10-02'],
    objectives: [
      'Use CELERY_TASK_ALWAYS_EAGER in tests',
      'Mock external services in task tests',
      'Test retry behavior and failure handling',
      'Integration test full task pipelines'
    ],
    sections: [
      {
        id: 'sec-10-12-1',
        type: 'concept',
        title: 'Testing Async Code Synchronously',
        content: `Testing distributed systems is notoriously difficult. If you call \`task.delay()\` in a unit test, the test will finish and assert before the Celery worker ever picks up the task.

To simplify unit testing, Celery provides the \`task_always_eager\` setting. When enabled, any call to \`delay()\` or \`apply_async()\` executes the task synchronously in the same thread, completely bypassing the broker. This allows you to test the logic of the task itself easily.`
      },
      {
        id: 'sec-10-12-2',
        type: 'implementation',
        title: 'Pytest Fixtures for Celery',
        content: `We can configure Pytest to automatically set Celery to eager mode during tests.`,
        codeExample: {
          id: 'code-10-12-1',
          language: 'python',
          title: 'Pytest Setup for Celery',
          filename: 'test_tasks.py',
          code: `import pytest
from app.tasks.math import add_numbers
from app.core.celery_app import celery_app

@pytest.fixture(autouse=True)
def setup_celery():
    # Force tasks to execute synchronously
    celery_app.conf.update(
        task_always_eager=True,
        task_eager_propagates=True # Ensure exceptions are raised
    )

def test_add_numbers_task():
    # Because of eager mode, this blocks and returns the result directly
    result = add_numbers.delay(5, 5)
    
    assert result.successful()
    assert result.result == 10
    
def test_task_direct_call():
    # Alternatively, test the function directly without Celery machinery
    assert add_numbers(5, 5) == 10`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-10-12',
        title: 'Test Exception Handling',
        description: 'Write a test that asserts a specific task (divide_task) raises a ZeroDivisionError when dividing by zero, assuming task_eager_propagates=True is set.',
        hint: 'Use pytest.raises(ZeroDivisionError).',
        solution: 'Testing failure paths is just as critical as testing success paths.',
        solutionCode: {
          id: 'sol-10-12',
          language: 'python',
          title: 'Solution',
          filename: 'solution.py',
          code: `import pytest
from app.tasks import divide_task

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide_task.delay(10, 0)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'int-10-12-1',
        question: 'Why might testing with `task_always_eager=True` be insufficient for a production application?',
        answer: 'Eager mode completely bypasses message serialization and broker routing. A task might pass in eager mode because it passes complex Python objects directly in memory, but fail in production because those objects cannot be serialized to JSON for the broker.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: 'pn-10-12',
        severity: 'info',
        content: 'For true end-to-end integration tests, use Testcontainers or Docker Compose to spin up a real Redis/RabbitMQ instance and a real Celery worker process alongside your test suite.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-10-12',
        scenario: 'Serialization Bug in Production',
        problem: 'A task worked perfectly in Pytest unit tests but crashed immediately in production with an `EncodeError`.',
        solution: 'The developer was passing a SQLAlchemy ORM model directly to the task. It worked in eager mode (in-memory) but failed JSON serialization. The fix was passing the database Row ID integer instead, and the testing strategy was updated to include full broker integration tests.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-10-12',
        title: 'Passing Complex Objects to Tasks',
        description: 'Never pass ORM instances or complex objects as arguments to Celery tasks.',
        badCode: {
          id: 'bad-10-12',
          language: 'python',
          title: '❌ Wrong Way',
          code: `user = db.query(User).first()
send_welcome_email.delay(user) # Fails serialization`
        },
        goodCode: {
          id: 'good-10-12',
          language: 'python',
          title: '✅ Correct Way',
          code: `user = db.query(User).first()
# Pass primitive IDs, task fetches object
send_welcome_email.delay(user.id)`
        }
      }
    ],
    codeExamples: [],
  }
};
