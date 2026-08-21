import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch04Lessons: Record<string, Lesson> = {
  'acid-properties-deep-dive': {
    id: '04-01',
    slug: 'acid-properties-deep-dive',
    chapterId: 4,
    order: 1,
    title: 'ACID Properties Deep Dive',
    description: 'Understand how PostgreSQL implements ACID guarantees under the hood and when they can fail.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql],
    prerequisites: [],
    objectives: [
      'Explain atomicity at the WAL level',
      'Understand MVCC for consistency and isolation',
      'Know when durability can still lose data (fsync)',
      'Identify which ACID guarantees you can relax'
    ],
    sections: [
      {
        id: 'acid-concept',
        type: 'concept',
        title: 'Beyond the Acronym: True ACID',
        content: `Most developers know ACID stands for Atomicity, Consistency, Isolation, and Durability. But knowing the acronym is very different from understanding how a modern relational database like PostgreSQL actually implements these guarantees.\n\nAtomicity is often described as "all or nothing," but technically, it's implemented using Write-Ahead Logging (WAL). PostgreSQL writes the intention to change data to the WAL before actually modifying the data pages. If the database crashes mid-transaction, during recovery it replays the WAL to restore a consistent state.\n\nIsolation is achieved through Multi-Version Concurrency Control (MVCC). Instead of locking rows and blocking reads, PostgreSQL creates new versions of rows for updates. This means readers don't block writers, and writers don't block readers, leading to high concurrency.`
      },
      {
        id: 'mvcc-implementation',
        type: 'architecture',
        title: 'MVCC in Action',
        content: `Understanding MVCC is crucial for tuning PostgreSQL. Every row has two hidden system columns: \`xmin\` (the transaction ID that created the row) and \`xmax\` (the transaction ID that deleted or updated the row).\n\nWhen a transaction reads data, it compares its own transaction snapshot against these \`xmin\` and \`xmax\` values to determine if a row version should be visible. This is why long-running transactions can cause database bloat—PostgreSQL cannot vacuum old row versions if an active transaction might still need them to satisfy its snapshot visibility.`
      },
      {
        id: 'durability-tradeoffs',
        type: 'production',
        title: 'When Durability Fails',
        content: `Durability promises that once a transaction is committed, it remains committed, even in the event of a power loss. However, this is largely dependent on the operating system and hardware. PostgreSQL uses the \`fsync()\` system call to ensure WAL data is flushed from the OS cache to physical disk.\n\nIn production, performance vs. durability is a known tradeoff. The setting \`synchronous_commit = off\` tells PostgreSQL to return success before the WAL is flushed to disk. You might lose up to 3 seconds of data if the server crashes, but write throughput increases dramatically.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-04-01',
        question: 'How does PostgreSQL handle read visibility for concurrent transactions without using read locks?',
        answer: 'PostgreSQL uses MVCC (Multi-Version Concurrency Control). It maintains multiple versions of a row, tracked by xmin and xmax system columns. A transaction determines row visibility by comparing these transaction IDs against its own snapshot.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-04-01',
        severity: 'warning',
        content: 'Be cautious with long-running transactions. They prevent PostgreSQL from vacuuming dead tuples via autovacuum, leading to table bloat and degraded performance.'
      }
    ],
    codeExamples: [],
    challenges: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'race-conditions': {
    id: '04-02',
    slug: 'race-conditions',
    chapterId: 4,
    order: 2,
    title: 'Race Conditions in Concurrent Systems',
    description: 'Learn to identify, reproduce, and fix lost updates and phantom reads in FastAPI.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['04-01'],
    objectives: [
      'Reproduce a lost update with concurrent requests',
      'Observe phantom reads in practice',
      'Understand why read-then-write is never atomic',
      'Use load testing to trigger race conditions'
    ],
    sections: [
      {
        id: 'race-concept',
        type: 'concept',
        title: 'The Read-Modify-Write Anti-pattern',
        content: `A race condition occurs when the timing of concurrent events affects the correctness of the system. In web APIs, the most common race condition is the "Lost Update."\n\nThe classic mistake is the read-modify-write cycle: reading a value, doing some calculation in Python, and saving it back. If two requests do this simultaneously, Request B might overwrite Request A's changes, because Request B read the state before Request A committed its update.\n\nThese issues are invisible during local development where requests are processed sequentially. They only manifest under load in production.`
      },
      {
        id: 'lost-update-implementation',
        type: 'implementation',
        title: 'Reproducing a Lost Update',
        content: `Here is a textbook example of a lost update in FastAPI. We are trying to increment a user's wallet balance. If two requests hit this endpoint concurrently, they might both read a balance of 100, add 50, and both save 150. We lose 50 credits.`,
        codeExample: {
          id: 'lost-update-code',
          language: 'python',
          title: 'Vulnerable Balance Endpoint',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import get_db
from .models import Wallet

app = FastAPI()

@app.post("/wallets/{wallet_id}/add-funds")
def add_funds(wallet_id: int, amount: float, db: Session = Depends(get_db)):
    # ❌ BAD: Read-Modify-Write pattern
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
    
    # Context switch happens here during concurrent requests
    
    new_balance = wallet.balance + amount
    wallet.balance = new_balance
    
    db.commit()
    return {"balance": wallet.balance}`
        }
      }
    ],
    commonMistakes: [
      {
        id: 'cm-04-02',
        title: 'Assuming ORM updates are atomic',
        description: 'Developers often assume that modifying an ORM object and calling commit() translates to an atomic database operation. It does not; it translates to an absolute UPDATE statement.',
        badCode: {
          id: 'bc-04-02',
          language: 'python',
          title: '❌ Read-Modify-Write',
          code: `user = db.query(User).get(1)
user.views += 1
db.commit()
# Executes: UPDATE users SET views = 11 WHERE id = 1;`
        },
        goodCode: {
          id: 'gc-04-02',
          language: 'python',
          title: '✅ Atomic Update',
          code: `from sqlalchemy import update
db.execute(
    update(User)
    .where(User.id == 1)
    .values(views=User.views + 1)
)
db.commit()
# Executes: UPDATE users SET views = views + 1 WHERE id = 1;`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
  },
  'select-for-update': {
    id: '04-03',
    slug: 'select-for-update',
    chapterId: 4,
    order: 3,
    title: 'SELECT FOR UPDATE & Row-Level Locking',
    description: 'Use pessimistic locking to serialize access to critical rows and prevent race conditions.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.sqlalchemy],
    prerequisites: ['04-02'],
    objectives: [
      'Use SELECT FOR UPDATE in SQLAlchemy',
      'Understand lock acquisition and blocking',
      'Use SKIP LOCKED for work queues',
      'Handle lock timeouts gracefully'
    ],
    sections: [
      {
        id: 'sfu-concept',
        type: 'concept',
        title: 'Pessimistic Locking Explained',
        content: `When atomic updates (like \`SET balance = balance + 50\`) are not enough—perhaps because the new value depends on complex logic or validation across multiple tables—you need Row-Level Locking.\n\n\`SELECT FOR UPDATE\` explicitly locks the rows returned by a query. Other transactions attempting to update, delete, or acquire a lock on those same rows will block and wait until the first transaction completes (commits or rolls back).\n\nThis is called pessimistic locking because it assumes a conflict will happen and proactively prevents it.`
      },
      {
        id: 'sfu-implementation',
        type: 'implementation',
        title: 'Using with_for_update()',
        content: `In SQLAlchemy, you apply a row lock using \`.with_for_update()\`. This fixes our lost update problem by forcing concurrent requests to queue up and process sequentially for that specific row.`,
        codeExample: {
          id: 'sfu-code',
          language: 'python',
          title: 'Secure Balance Endpoint',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import Wallet

app = FastAPI()

@app.post("/wallets/{wallet_id}/withdraw")
def withdraw_funds(wallet_id: int, amount: float, db: Session = Depends(get_db)):
    # ✅ Locks the row until db.commit() or db.rollback()
    wallet = (
        db.query(Wallet)
        .filter(Wallet.id == wallet_id)
        .with_for_update()
        .first()
    )
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
        
    if wallet.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
        
    wallet.balance -= amount
    db.commit()
    
    return {"balance": wallet.balance}`
        }
      },
      {
        id: 'skip-locked',
        type: 'architecture',
        title: 'Building Queues with SKIP LOCKED',
        content: `A specialized variant is \`SELECT FOR UPDATE SKIP LOCKED\`. This skips rows that are already locked by other transactions. It is incredibly useful for building robust, high-concurrency job queues inside PostgreSQL, allowing multiple workers to safely dequeue tasks without blocking each other or double-processing.`
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-04-03',
        question: 'What happens if two transactions issue SELECT FOR UPDATE on the same row?',
        answer: 'The first transaction acquires the row lock. The second transaction blocks and waits. It will continue execution only when the first transaction commits or rolls back (or if the lock_timeout is reached, raising an error).',
        difficulty: 'expert'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'optimistic-locking': {
    id: '04-04',
    slug: 'optimistic-locking',
    chapterId: 4,
    order: 4,
    title: 'Optimistic Locking with Version Columns',
    description: 'Solve race conditions without database locks using compare-and-swap techniques.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.sqlalchemy, technologies.postgresql],
    prerequisites: ['04-02'],
    objectives: [
      'Add version column to SQLAlchemy models',
      'Implement compare-and-swap update pattern',
      'Handle optimistic lock conflicts with retries',
      'Choose optimistic vs pessimistic locking'
    ],
    sections: [
      {
        id: 'optimistic-concept',
        type: 'concept',
        title: 'The Compare-and-Swap Pattern',
        content: `Pessimistic locking (\`SELECT FOR UPDATE\`) is safe but can reduce throughput by blocking concurrent requests. Optimistic locking takes a different approach: it assumes conflicts are rare.\n\nInstead of locking a row, it adds a \`version\` column to the table. When updating, the system checks if the version has changed since it was read. If it has, the update is rejected (a conflict occurred), and the application can retry the operation. This is also known as a Compare-And-Swap (CAS) operation.`
      },
      {
        id: 'optimistic-implementation',
        type: 'implementation',
        title: 'Implementing in SQLAlchemy',
        content: `SQLAlchemy has built-in support for optimistic locking. By setting \`version_id_col\`, SQLAlchemy automatically includes the version check in UPDATE statements and raises a \`StaleDataError\` if a conflict is detected.`,
        codeExample: {
          id: 'optimistic-code',
          title: 'Optimistic Locking Setup',
          files: {
            'models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Document(Base):
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    content = Column(String)
    
    # Version column for optimistic locking
    version_id = Column(Integer, nullable=False)
    
    __mapper_args__ = {
        'version_id_col': version_id
    }`
            },
            'main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError
from .models import Document
from .database import get_db

app = FastAPI()

@app.put("/documents/{doc_id}")
def update_document(doc_id: int, new_content: str, db: Session = Depends(get_db)):
    doc = db.query(Document).get(doc_id)
    if not doc:
        raise HTTPException(status_code=404)
        
    doc.content = new_content
    
    try:
        # SQLAlchemy automatically adds: WHERE id = ? AND version_id = ?
        db.commit()
    except StaleDataError:
        db.rollback()
        raise HTTPException(
            status_code=409, 
            detail="Document modified by another user. Please refresh."
        )
        
    return {"message": "Success"}`
            }
          }
        }
      }
    ],
    realWorldScenarios: [
      {
        id: 'rws-04-04',
        scenario: 'Wiki Page Editing',
        problem: 'Two admins edit the same markdown page simultaneously. Admin B saves after Admin A, overwriting Admin A\'s work silently.',
        solution: 'Optimistic locking was added. When Admin B saves, the system detects the version mismatch and prompts Admin B to review Admin A\'s changes before saving.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    commonMistakes: [],
  },
  'advisory-locks': {
    id: '04-05',
    slug: 'advisory-locks',
    chapterId: 4,
    order: 5,
    title: 'PostgreSQL Advisory Locks',
    description: 'Use application-defined database locks for coordination across distributed workers.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.postgresql],
    prerequisites: ['04-03'],
    objectives: [
      'Use pg_try_advisory_lock for non-blocking locks',
      'Implement distributed locks with advisory locks',
      'Handle lock cleanup on connection close',
      'Compare advisory locks vs Redis locks'
    ],
    sections: [
      {
        id: 'advisory-concept',
        type: 'concept',
        title: 'Application-Defined Locking',
        content: `Row-level locks (\`SELECT FOR UPDATE\`) are tied to specific rows in tables. But sometimes you need to lock a conceptual resource—like "preventing this specific cron job from running on two servers at once" or "rate limiting an API key across workers."\n\nPostgreSQL Advisory Locks allow you to define locks that have application meaning. They are just integer identifiers that you lock using PostgreSQL's high-speed memory structures. They don't block table operations and are highly efficient.`
      },
      {
        id: 'advisory-implementation',
        type: 'implementation',
        title: 'Distributed Cron Job Coordination',
        content: `A common use case is ensuring a scheduled task (like a Celery beat job) only executes once across a cluster of nodes. We use \`pg_try_advisory_lock\`, which returns immediately with a boolean, instead of waiting.`,
        codeExample: {
          id: 'advisory-code',
          language: 'python',
          title: 'Advisory Lock Service',
          filename: 'service.py',
          code: `from sqlalchemy.orm import Session
from sqlalchemy import text
import struct

def acquire_lock(db: Session, lock_name: str) -> bool:
    # Convert string name to 64-bit integer
    lock_id = struct.unpack("q", lock_name.encode('utf-8')[:8].ljust(8, b'\\0'))[0]
    
    # Attempt to acquire session-level advisory lock
    result = db.execute(
        text("SELECT pg_try_advisory_lock(:id)"),
        {"id": lock_id}
    ).scalar()
    
    return result

def run_daily_report(db: Session):
    if not acquire_lock(db, "daily_report_lock"):
        print("Another worker is already running the report. Exiting.")
        return
        
    try:
        print("Generating report...")
        # do heavy work
    finally:
        # Usually unlocked by connection close, or explicitly:
        lock_id = struct.unpack("q", b"daily_re".ljust(8, b'\\0'))[0]
        db.execute(text("SELECT pg_advisory_unlock(:id)"), {"id": lock_id})`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-04-05',
        question: 'What is the difference between a transaction-level and session-level advisory lock?',
        answer: 'Transaction-level advisory locks are automatically released at the end of the transaction. Session-level advisory locks persist until explicitly unlocked or until the database connection is closed.',
        difficulty: 'expert'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'savepoints-nested-transactions': {
    id: '04-06',
    slug: 'savepoints-nested-transactions',
    chapterId: 4,
    order: 6,
    title: 'Savepoints & Nested Transactions',
    description: 'Use savepoints to handle partial failures within a larger database transaction.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.sqlalchemy, technologies.postgresql],
    prerequisites: [],
    objectives: [
      'Create and release savepoints',
      'Rollback to a savepoint on partial failure',
      'Use nested transactions in SQLAlchemy',
      'Model complex multi-step business operations'
    ],
    sections: [
      {
        id: 'savepoint-concept',
        type: 'concept',
        title: 'Partial Rollbacks in SQL',
        content: `Standard transactions are binary: commit everything or roll back everything. However, complex operations might involve bulk inserts or loops where you want to ignore a specific failing row but continue processing the rest.\n\nSavepoints provide sub-transaction behavior. You can establish a savepoint, execute some queries, and if they fail, roll back *only* to that savepoint, preserving the work done earlier in the main transaction.`
      },
      {
        id: 'savepoint-implementation',
        type: 'implementation',
        title: 'SQLAlchemy begin_nested()',
        content: `In SQLAlchemy, you use \`session.begin_nested()\` to create a PostgreSQL savepoint. This is essential when attempting speculative inserts where a unique constraint violation might occur.`,
        codeExample: {
          id: 'savepoint-code',
          language: 'python',
          title: 'Graceful Error Recovery',
          filename: 'main.py',
          code: `from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .models import User

def import_users_safely(db: Session, users_data: list[dict]):
    successful = 0
    failed = 0
    
    for data in users_data:
        # Create a SAVEPOINT
        with db.begin_nested():
            try:
                new_user = User(email=data['email'])
                db.add(new_user)
                # Flush to trigger DB constraints immediately
                db.flush()
                successful += 1
            except IntegrityError:
                # Rolling back out of the context manager 
                # rolls back only to the savepoint!
                failed += 1
                print(f"Skipping duplicate email: {data['email']}")
                
    # Commit the main transaction (all successful inserts)
    db.commit()
    return successful, failed`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'idempotency': {
    id: '04-07',
    slug: 'idempotency',
    chapterId: 4,
    order: 7,
    title: 'Idempotency: Building Reliable APIs',
    description: 'Guarantee that retried requests do not result in duplicated actions like double-charging.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: [],
    objectives: [
      'Design idempotency key storage schema',
      'Implement idempotency in payment endpoints',
      'Handle duplicate requests correctly',
      'Return cached results for duplicate idempotency keys'
    ],
    sections: [
      {
        id: 'idempotency-concept',
        type: 'concept',
        title: 'The Problem with Network Timeouts',
        content: `When an API client sends a POST request and receives a network timeout, it is in a blind spot. Did the server process the request and fail to return the response? Or did the request never reach the server at all?\n\nThe only safe action for the client is to retry. But if the endpoint processes payments, a retry might charge the user twice. Idempotency is the property that an operation can be applied multiple times without changing the result beyond the initial application.`
      },
      {
        id: 'idempotency-implementation',
        type: 'implementation',
        title: 'Implementing an Idempotency Layer',
        content: `Clients must generate a unique UUID (Idempotency-Key) and send it in the headers. The server checks a database table for this key. If it exists, the server short-circuits and returns the stored response.`,
        codeExample: {
          id: 'idempotency-code',
          title: 'Idempotency Implementation',
          files: {
            'models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, String, JSON, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class IdempotencyKey(Base):
    __tablename__ = 'idempotency_keys'
    
    idempotency_key = Column(String, primary_key=True)
    endpoint_path = Column(String, nullable=False)
    response_status = Column(Integer, nullable=False)
    response_body = Column(JSON, nullable=False)`
            },
            'main.py': {
              language: 'python',
              code: `from fastapi import FastAPI, Depends, Header, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from .database import get_db
from .models import IdempotencyKey

app = FastAPI()

@app.post("/payments/charge")
def charge_card(
    request: Request,
    amount: float, 
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    # 1. Check for existing key
    existing = db.query(IdempotencyKey).filter_by(idempotency_key=idempotency_key).first()
    if existing:
        return JSONResponse(
            status_code=existing.response_status, 
            content=existing.response_body
        )
        
    # 2. Process payment (logic omitted)
    result_data = {"status": "success", "charge_id": "ch_123", "amount": amount}
    
    # 3. Store idempotency result and commit payment in SAME transaction
    key_record = IdempotencyKey(
        idempotency_key=idempotency_key,
        endpoint_path=request.url.path,
        response_status=200,
        response_body=result_data
    )
    db.add(key_record)
    db.commit()
    
    return result_data`
            }
          }
        }
      }
    ],
    productionNotes: [
      {
        id: 'pn-04-07',
        severity: 'critical',
        content: 'You must acquire a database lock or use INSERT ON CONFLICT on the idempotency key early in the request lifecycle to prevent race conditions if two identical requests arrive at the exact same millisecond.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'deadlock-detection': {
    id: '04-08',
    slug: 'deadlock-detection',
    chapterId: 4,
    order: 8,
    title: 'Deadlock Detection & Prevention',
    description: 'Diagnose and resolve database deadlocks in concurrent applications.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.postgresql],
    prerequisites: ['04-03'],
    objectives: [
      'Reproduce a deadlock with two concurrent transactions',
      'Read PostgreSQL deadlock error messages',
      'Order lock acquisitions consistently to prevent deadlocks',
      'Set lock_timeout to fail fast instead of hanging'
    ],
    sections: [
      {
        id: 'deadlock-concept',
        type: 'concept',
        title: 'The Deadly Embrace',
        content: `A deadlock occurs when Transaction A holds a lock on Resource 1 and waits for Resource 2, while Transaction B holds a lock on Resource 2 and waits for Resource 1. Neither can proceed. PostgreSQL has a built-in deadlock detector that runs periodically (configured by \`deadlock_timeout\`, default 1s). When it detects a cycle, it kills one of the transactions to unblock the other.`
      },
      {
        id: 'deadlock-implementation',
        type: 'implementation',
        title: 'Consistent Ordering Strategy',
        content: `The primary way to prevent deadlocks is to ensure all transactions acquire locks in the exact same order. If you need to update multiple rows, always sort the IDs first before locking them.`,
        codeExample: {
          id: 'deadlock-code',
          language: 'python',
          title: 'Deadlock-Free Fund Transfer',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import Wallet

app = FastAPI()

@app.post("/transfer")
def transfer_funds(from_id: int, to_id: int, amount: float, db: Session = Depends(get_db)):
    # Prevent transferring to oneself
    if from_id == to_id:
        raise HTTPException(status_code=400)

    # ✅ ALWAYS LOCK IN A CONSISTENT ORDER (e.g., lowest ID first)
    # This completely eliminates deadlocks when concurrent transfers happen
    # between the same two accounts in opposite directions.
    wallet_ids = sorted([from_id, to_id])
    
    # Lock both rows
    wallets = (
        db.query(Wallet)
        .filter(Wallet.id.in_(wallet_ids))
        .with_for_update()
        .all()
    )
    
    wallet_dict = {w.id: w for w in wallets}
    source = wallet_dict.get(from_id)
    dest = wallet_dict.get(to_id)
    
    if source.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
        
    source.balance -= amount
    dest.balance += amount
    
    db.commit()
    return {"message": "Transfer successful"}`
        }
      }
    ],
    challenges: [
      {
        id: 'ch-04-08',
        title: 'Diagnose the Deadlock',
        description: 'Open two psql terminal sessions. Start a transaction in both. Recreate a classic deadlock scenario manually.',
        hint: 'Session A updates Row 1. Session B updates Row 2. Session A updates Row 2. Session B updates Row 1.',
        solution: 'PostgreSQL will detect the cycle after about 1 second and issue a deadloack_detected error, rolling back one of the sessions.',
        solutionCode: {
          id: 'sc-04-08',
          language: 'sql',
          title: 'psql Script',
          filename: 'deadlock.sql',
          code: `-- Terminal A
BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;

-- Terminal B
BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 2;

-- Terminal A
UPDATE accounts SET balance = balance + 10 WHERE id = 2; -- Blocks

-- Terminal B
UPDATE accounts SET balance = balance + 10 WHERE id = 1; -- Deadlock!`
        }
      }
    ],
    codeExamples: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'exactly-once-semantics': {
    id: '04-09',
    slug: 'exactly-once-semantics',
    chapterId: 4,
    order: 9,
    title: 'Exactly-Once vs At-Least-Once Semantics',
    description: 'Understand messaging delivery guarantees and build systems that act exactly once.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['04-07'],
    objectives: [
      'Explain exactly-once, at-least-once, at-most-once',
      'Use idempotency to convert at-least-once to exactly-once',
      'Design payment systems for exactly-once semantics',
      'Handle duplicate event delivery in consumers'
    ],
    sections: [
      {
        id: 'semantics-concept',
        type: 'concept',
        title: 'The Myth of Exactly-Once Delivery',
        content: `In distributed systems, networks drop packets. Because of this, messaging systems (like Kafka, RabbitMQ, or webhooks) typically offer "At-Least-Once" delivery. They will keep retrying until acknowledged. \n\n"Exactly-Once Delivery" over a network is practically impossible without severe performance penalties. However, "Exactly-Once Processing" is achievable. We combine At-Least-Once delivery with Idempotent receivers. The message might arrive three times, but the side-effect only happens once.`
      },
      {
        id: 'semantics-implementation',
        type: 'implementation',
        title: 'Webhook Processing',
        content: `When receiving Stripe webhooks, Stripe guarantees At-Least-Once delivery. Our FastAPI endpoint must track event IDs to ensure we process the fulfillment exactly once.`,
        codeExample: {
          id: 'semantics-code',
          language: 'python',
          title: 'Idempotent Webhook Handler',
          filename: 'main.py',
          code: `from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .database import get_db
from .models import ProcessedEvent, Order

app = FastAPI()

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    event_id = payload.get("id")
    
    # 1. Attempt to insert the event ID to claim processing rights
    try:
        with db.begin_nested():
            db.add(ProcessedEvent(event_id=event_id))
    except IntegrityError:
        # Event already processed! Return 200 OK so Stripe stops retrying.
        return {"status": "already_processed"}
        
    # 2. Perform business logic exactly once
    if payload["type"] == "payment_intent.succeeded":
        order_id = payload["data"]["object"]["metadata"]["order_id"]
        order = db.query(Order).get(order_id)
        order.status = "paid"
        
    db.commit()
    return {"status": "success"}`
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'payment-processing-patterns': {
    id: '04-10',
    slug: 'payment-processing-patterns',
    chapterId: 4,
    order: 10,
    title: 'Payment Processing Patterns',
    description: 'Design robust payment flows using state machines, atomic updates, and rollback strategies.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['04-03', '04-07'],
    objectives: [
      'Implement atomic balance deduction',
      'Handle payment gateway timeouts with idempotency',
      'Rollback on downstream failures',
      'Design the payment state machine'
    ],
    sections: [
      {
        id: 'payment-concept',
        type: 'concept',
        title: 'The Payment State Machine',
        content: `Payments should never be just "pending" and "success". Interacting with external payment gateways (like Stripe or PayPal) is slow and failure-prone. A robust payment system uses an explicit state machine.\n\nTypical states: \`INITIALIZED\`, \`AUTHORIZATION_PENDING\`, \`AUTHORIZED\`, \`CAPTURE_PENDING\`, \`CAPTURED\`, \`FAILED\`, \`REFUNDED\`. State transitions must be atomic, and we must never transition from \`FAILED\` to \`CAPTURED\`.`
      },
      {
        id: 'payment-implementation',
        type: 'implementation',
        title: 'Two-Phase Payment Flow',
        content: `A common pattern is authorizing funds first, fulfilling the order, and then capturing the funds. This prevents taking money if inventory runs out midway.`,
        codeExample: {
          id: 'payment-code',
          title: 'Payment Service',
          files: {
            'schemas.py': {
              language: 'python',
              code: `from enum import Enum

class PaymentState(str, Enum):
    INITIALIZED = "initialized"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"`
            },
            'service.py': {
              language: 'python',
              code: `from sqlalchemy.orm import Session
from .models import Payment, Order
from .schemas import PaymentState
import payment_gateway  # mock external SDK

def process_checkout(db: Session, order_id: int):
    order = db.query(Order).with_for_update().get(order_id)
    payment = Payment(order_id=order.id, amount=order.total, state=PaymentState.INITIALIZED)
    db.add(payment)
    db.commit() # Commit initial state
    
    try:
        # 1. Authorize with external gateway
        auth_result = payment_gateway.authorize(amount=payment.amount)
        payment.gateway_txn_id = auth_result.txn_id
        payment.state = PaymentState.AUTHORIZED
        db.commit()
        
        # 2. Fulfill order (e.g., reserve inventory)
        fulfill_order(db, order)
        
        # 3. Capture funds
        payment_gateway.capture(auth_result.txn_id)
        payment.state = PaymentState.CAPTURED
        db.commit()
        
    except Exception as e:
        # Rollback external changes if possible
        if payment.state == PaymentState.AUTHORIZED:
            payment_gateway.void(payment.gateway_txn_id)
            
        payment.state = PaymentState.FAILED
        db.commit()
        raise e`
            }
          }
        }
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'inventory-reservation': {
    id: '04-11',
    slug: 'inventory-reservation',
    chapterId: 4,
    order: 11,
    title: 'Inventory Reservation & Booking Systems',
    description: 'Build high-concurrency ticket booking and inventory management systems.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.fastapi, technologies.redis],
    prerequisites: ['04-03'],
    objectives: [
      'Implement pessimistic inventory locking',
      'Use optimistic locking for low-contention inventory',
      'Add TTL to reservations to prevent stuck locks',
      'Load test the booking system for race conditions'
    ],
    sections: [
      {
        id: 'inventory-concept',
        type: 'concept',
        title: 'The Overselling Problem',
        content: `When selling limited stock—like concert tickets or limited edition sneakers—concurrency spikes dramatically. If you just check \`if stock > 0\` and then decrement, you will inevitably oversell when thousands of requests arrive simultaneously.\n\nFurthermore, users expect to "hold" inventory in their cart while typing credit card details. If they abandon the cart, the inventory must be released. Database locks are not suitable for holding inventory over a user session duration.`
      },
      {
        id: 'inventory-implementation',
        type: 'implementation',
        title: 'Redis for Temporary Reservations',
        content: `To handle high-throughput reservations with automatic expiration, Redis is the ideal tool. We decrement available stock atomically in Redis and set an expiration key.`,
        codeExample: {
          id: 'inventory-code',
          language: 'python',
          title: 'Redis Inventory Reservation',
          filename: 'service.py',
          code: `import redis
from fastapi import HTTPException
import uuid

redis_client = redis.Redis(host='localhost', port=6379, db=0)
RESERVATION_TTL = 900 # 15 minutes

def reserve_inventory(product_id: int, quantity: int) -> str:
    stock_key = f"product:{product_id}:stock"
    
    # LUA script for atomic check-and-decrement in Redis
    lua_script = """
    local current_stock = tonumber(redis.call('get', KEYS[1]) or 0)
    local qty = tonumber(ARGV[1])
    
    if current_stock >= qty then
        redis.call('decrby', KEYS[1], qty)
        return 1
    else
        return 0
    end
    """
    
    # Execute atomic decrement
    success = redis_client.eval(lua_script, 1, stock_key, quantity)
    
    if not success:
        raise HTTPException(status_code=400, detail="Out of stock")
        
    # Generate unique reservation token
    reservation_id = str(uuid.uuid4())
    res_key = f"reservation:{reservation_id}"
    
    # Store reservation details with a TTL
    redis_client.hset(res_key, mapping={
        "product_id": product_id, 
        "quantity": quantity
    })
    redis_client.expire(res_key, RESERVATION_TTL)
    
    return reservation_id`
        }
      }
    ],
    productionNotes: [
      {
        id: 'pn-04-11',
        severity: 'info',
        content: 'You must build a background worker that listens for Redis expiration events (or runs periodically) to reclaim inventory for expired reservations back into the main stock pool.'
      }
    ],
    codeExamples: [],
    challenges: [],
    interviewQuestions: [],
    realWorldScenarios: [],
    commonMistakes: [],
  },
  'distributed-transactions': {
    id: '04-12',
    slug: 'distributed-transactions',
    chapterId: 4,
    order: 12,
    title: 'Distributed Transactions & the Saga Pattern',
    description: 'Coordinate transactions across multiple microservices without locking the database.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['04-10'],
    objectives: [
      'Explain why 2PC fails in distributed systems',
      'Implement the choreography-based Saga pattern',
      'Write compensating transactions for rollback',
      'Handle partial failures in multi-step operations'
    ],
    sections: [
      {
        id: 'saga-concept',
        type: 'concept',
        title: 'Beyond the Monolith',
        content: `In a monolith, you wrap operations in a single database transaction. If creating a user and creating a wallet fails, the database rolls both back. But what if User Service and Wallet Service have different databases?\n\nTraditional approaches like Two-Phase Commit (2PC) cause huge performance bottlenecks due to distributed locking. Modern architectures use the Saga Pattern: a sequence of local transactions where each updates data within a single service.`
      },
      {
        id: 'saga-architecture',
        type: 'architecture',
        title: 'Compensating Transactions',
        content: `If a local transaction in a Saga fails, you cannot simply issue a \`ROLLBACK\`. The previous steps have already committed their data to their respective databases! Instead, the Saga executes Compensating Transactions—explicit operations that undo the work of the previous steps (e.g., if "Create Wallet" fails, run "Deactivate User").`
      },
      {
        id: 'saga-implementation',
        type: 'implementation',
        title: 'Choreography Saga Example',
        content: `In a choreography saga, microservices communicate via events. A failure event triggers compensating endpoints.`,
        codeExample: {
          id: 'saga-code',
          title: 'Order Processing Saga',
          files: {
            'order_service.py': {
              language: 'python',
              code: `from fastapi import APIRouter, BackgroundTasks
import requests

router = APIRouter()

@router.post("/orders")
def create_order(order_data: dict, background_tasks: BackgroundTasks):
    # 1. Local Transaction: Create Order (PENDING)
    order_id = db_create_order(order_data)
    
    # 2. Trigger next step in Saga via event/webhook
    background_tasks.add_task(call_payment_service, order_id, order_data)
    return {"order_id": order_id, "status": "pending"}

@router.post("/orders/{order_id}/compensate")
def compensate_order(order_id: int):
    # This is called if a downstream service fails
    order = db_get_order(order_id)
    order.status = "CANCELLED_DUE_TO_FAILURE"
    db_save(order)
    return {"status": "compensated"}`
            },
            'payment_service.py': {
              language: 'python',
              code: `from fastapi import APIRouter
import requests

router = APIRouter()

@router.post("/process-payment")
def process_payment(order_id: int, amount: float):
    try:
        # 1. Local Transaction: Charge card
        charge_card(amount)
        
        # 2. Trigger next step (e.g. Inventory)
        requests.post("http://inventory/reserve", json={"order_id": order_id})
    except Exception:
        # SAGA FAILURE: Trigger compensation for previous steps
        requests.post(f"http://order/orders/{order_id}/compensate")
        return {"status": "failed"}`
            }
          }
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-04-12',
        question: 'What is the main drawback of the Saga pattern compared to a distributed 2PC transaction?',
        answer: 'Eventual consistency and lack of isolation. Because a Saga commits local transactions sequentially, other transactions might observe partial states (e.g., an order created but not yet paid) before the entire Saga completes.',
        difficulty: 'expert'
      }
    ],
    codeExamples: [],
    challenges: [],
    productionNotes: [],
    realWorldScenarios: [],
    commonMistakes: [],
  }
};
