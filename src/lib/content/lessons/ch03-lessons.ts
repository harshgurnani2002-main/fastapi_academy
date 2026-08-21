import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch03Lessons: Record<string, Lesson> = {
  'sqlalchemy-2x-async': {
    id: '03-01',
    slug: 'sqlalchemy-2x-async',
    chapterId: 3,
    order: 1,
    title: 'SQLAlchemy 2.x & AsyncSession',
    description: 'Master async database operations with SQLAlchemy 2.0.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.sqlalchemy, technologies.postgresql, technologies.python],
    prerequisites: ['02-05'],
    objectives: [
      'Use AsyncSession for all database operations',
      'Write ORM queries with select() API',
      'Manage the unit of work pattern',
      'Configure the async engine and session factory'
    ],
    sections: [
      {
        id: '03-01-sec1',
        type: 'concept',
        title: 'The SQLAlchemy 2.0 Async Paradigm',
        content: `SQLAlchemy 2.0 introduced native async support, fundamentally changing how we interact with databases in FastAPI. Instead of relying on threads or blocking I/O, \`AsyncSession\` uses \`asyncio\` and drivers like \`asyncpg\` to yield control back to the event loop while waiting for database responses.\n\nThis architecture is crucial for high-concurrency applications. When a query is executed, the process is not blocked, allowing FastAPI to handle thousands of simultaneous requests efficiently. The new 2.0 style also mandates the use of the \`select()\` API, moving away from the legacy \`query()\` method, which aligns perfectly with asynchronous execution patterns.`
      },
      {
        id: '03-01-sec2',
        type: 'implementation',
        title: 'Configuring Async Engine and Session',
        content: `To set up async SQLAlchemy, you need an async driver (like \`asyncpg\`) and the \`create_async_engine\` function. We also use \`async_sessionmaker\` to generate new \`AsyncSession\` instances for each request.`,
        codeExample: {
          id: '03-01-code1',
          language: 'python',
          title: 'Database Configuration',
          files: {
            'app/database.py': {
              language: 'python',
              code: `from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession\nfrom sqlalchemy.orm import declarative_base\n\nDATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/db"\n\nengine = create_async_engine(\n    DATABASE_URL,\n    echo=False,\n    pool_size=20,\n    max_overflow=10\n)\n\nAsyncSessionLocal = async_sessionmaker(\n    bind=engine,\n    class_=AsyncSession,\n    expire_on_commit=False\n)\n\nBase = declarative_base()`
            },
            'app/dependencies.py': {
              language: 'python',
              code: `from app.database import AsyncSessionLocal\nfrom typing import AsyncGenerator\n\nasync def get_db() -> AsyncGenerator:\n    async with AsyncSessionLocal() as session:\n        yield session`
            }
          }
        }
      },
      {
        id: '03-01-sec3',
        type: 'production',
        title: 'Unit of Work & session lifecycle',
        content: `In production, managing the session lifecycle is critical. The session represents a "Unit of Work" (UoW). You should not pass sessions across different contexts or background tasks. Using dependency injection in FastAPI ensures that a session is opened at the start of a request and cleanly closed (and rolled back if necessary) at the end.\n\nBe mindful of \`expire_on_commit=False\`. In async contexts, lazy loading after a commit will raise an error because it requires implicit I/O. Disabling expiration ensures your objects remain usable after the transaction closes.`
      }
    ],
    codeExamples: [
      {
        id: '03-01-example1',
        title: 'Async ORM Queries',
        files: {
          'app/repositories.py': {
            language: 'python',
            code: `from sqlalchemy.ext.asyncio import AsyncSession\nfrom sqlalchemy import select\nfrom app.models import User\n\nclass UserRepository:\n    def __init__(self, session: AsyncSession):\n        self.session = session\n\n    async def get_by_email(self, email: str) -> User | None:\n        stmt = select(User).where(User.email == email)\n        result = await self.session.execute(stmt)\n        return result.scalar_one_or_none()`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-01-chal1',
        title: 'Implement an Async Repository',
        description: 'Create an async method to fetch all active users, ordered by creation date descending.',
        hint: 'Use select(), filter(), and order_by(). Remember to await session.execute().',
        solution: 'Use result.scalars().all() to get a list of models.',
        solutionCode: {
          id: '03-01-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'repository.py',
          code: `async def get_active_users(self) -> list[User]:\n    stmt = select(User).where(User.is_active == True).order_by(User.created_at.desc())\n    result = await self.session.execute(stmt)\n    return list(result.scalars().all())`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-01-int1',
        question: 'Why does lazy loading fail in SQLAlchemy async sessions?',
        answer: 'Lazy loading implies implicitly emitting a SQL query when accessing an unmapped attribute. Since this involves I/O, it must be awaited. Python\'s property access (e.g., user.posts) cannot be awaited natively, so SQLAlchemy blocks it to prevent synchronous I/O in the async event loop.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-01-prod1',
        severity: 'critical',
        content: 'Always set expire_on_commit=False in async_sessionmaker to prevent DetachedInstanceErrors when accessing object attributes after the transaction commits.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-01-rw1',
        scenario: 'Event Loop Blocked by Legacy Code',
        problem: 'A FastAPI app using async endpoints was experiencing massive latency spikes under load. The team found they were still using create_engine instead of create_async_engine.',
        solution: 'Migrated to create_async_engine and asyncpg, which non-blockingly yielded I/O tasks, instantly resolving the concurrency bottleneck.'
      }
    ],
    commonMistakes: [
      {
        id: '03-01-mistake1',
        title: 'Awaiting the Statement, Not the Execution',
        description: 'Developers often try to await the select() statement directly instead of awaiting session.execute().',
        badCode: {
          id: '03-01-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `result = await select(User).where(User.id == 1)`
        },
        goodCode: {
          id: '03-01-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `stmt = select(User).where(User.id == 1)\nresult = await session.execute(stmt)\nuser = result.scalar_one_or_none()`
        }
      }
    ]
  },
  'transaction-management': {
    id: '03-02',
    slug: 'transaction-management',
    chapterId: 3,
    order: 2,
    title: 'Transaction Management in SQLAlchemy',
    description: 'Master commit, rollback, and savepoints in async SQLAlchemy.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.sqlalchemy, technologies.postgresql],
    prerequisites: ['03-01'],
    objectives: [
      'Understand SQLAlchemy session transaction lifecycle',
      'Use begin/commit/rollback explicitly',
      'Handle exceptions and rollbacks',
      'Use nested transactions with savepoints'
    ],
    sections: [
      {
        id: '03-02-sec1',
        type: 'concept',
        title: 'The Transaction Lifecycle',
        content: `In SQLAlchemy, a session operates in a transaction by default. When you issue your first query, a transaction begins. It remains open until you explicitly call \`commit()\` or \`rollback()\`. This auto-begin behavior ensures data consistency, but requires careful handling to avoid long-running transactions that lock rows and degrade performance.\n\nTransactions should be kept as short as possible. In a web framework like FastAPI, the common pattern is to commit at the end of a successful request, or rollback in an exception handler.`
      },
      {
        id: '03-02-sec2',
        type: 'implementation',
        title: 'Explicit vs Implicit Transactions',
        content: `While SQLAlchemy auto-begins transactions, you can also use explicit transaction blocks. Using an async context manager \`async with session.begin():\` guarantees that the transaction is committed on success or rolled back on failure automatically.`,
        codeExample: {
          id: '03-02-code1',
          language: 'python',
          title: 'Transaction Context Managers',
          files: {
            'app/services.py': {
              language: 'python',
              code: `async def transfer_funds(session: AsyncSession, from_id: int, to_id: int, amount: float):\n    async with session.begin():\n        from_acc = await session.get(Account, from_id)\n        to_acc = await session.get(Account, to_id)\n        from_acc.balance -= amount\n        to_acc.balance += amount\n    # Commits automatically on exit, rolls back on exception`
            }
          }
        }
      },
      {
        id: '03-02-sec3',
        type: 'architecture',
        title: 'Nested Transactions (Savepoints)',
        content: `Sometimes you need to try an operation and recover gracefully without aborting the entire outer transaction. PostgreSQL and SQLAlchemy support this via SAVEPOINTs. You can create a nested transaction using \`session.begin_nested()\`. If an error occurs within this block, it only rolls back to the savepoint, leaving the outer transaction intact.`
      }
    ],
    codeExamples: [
      {
        id: '03-02-example1',
        title: 'Using Savepoints',
        files: {
          'app/services.py': {
            language: 'python',
            code: `async def create_user_with_audit(session: AsyncSession, user_data: dict):\n    user = User(**user_data)\n    session.add(user)\n    \n    try:\n        async with session.begin_nested():\n            audit = AuditLog(action="USER_CREATED", details=user.email)\n            session.add(audit)\n    except Exception:\n        # The nested block automatically rolls back the savepoint\n        # But we can still commit the user creation!\n        logger.warning("Audit log failed")\n    \n    await session.commit()`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-02-chal1',
        title: 'Handle Transaction Integrity',
        description: 'Write a FastAPI dependency that catches any HTTPException and rolls back the session.',
        hint: 'Use a try-except block wrapping the yield statement in your get_db dependency.',
        solution: 'Catching exceptions in the generator ensures cleanup.',
        solutionCode: {
          id: '03-02-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'dependencies.py',
          code: `async def get_db() -> AsyncGenerator:\n    async with AsyncSessionLocal() as session:\n        try:\n            yield session\n            await session.commit()\n        except Exception:\n            await session.rollback()\n            raise`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-02-int1',
        question: 'What happens if you forget to commit or rollback a session?',
        answer: 'The transaction remains open until the connection is returned to the pool, at which point SQLAlchemy usually issues a rollback by default (if pool_reset_on_return is enabled). However, during the request, holding an open transaction can block other queries and exhaust pool resources.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: '03-02-prod1',
        severity: 'warning',
        content: 'Avoid doing long-running I/O (like external API calls) while a database transaction is open. This holds locks and connection pool resources.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-02-rw1',
        scenario: 'Connection Pool Exhaustion',
        problem: 'An API endpoint started a transaction, then made a 5-second HTTP request to a third party before committing.',
        solution: 'Moved the external API call outside the transaction boundaries, drastically reducing connection hold times.'
      }
    ],
    commonMistakes: [
      {
        id: '03-02-mistake1',
        title: 'Swallowing Rollback Errors',
        description: 'Failing to raise exceptions after a rollback can lead to the application returning a 200 OK for a failed operation.',
        badCode: {
          id: '03-02-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `try:\n    await session.commit()\nexcept Exception:\n    await session.rollback()`
        },
        goodCode: {
          id: '03-02-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `try:\n    await session.commit()\nexcept Exception:\n    await session.rollback()\n    raise`
        }
      }
    ]
  },
  'isolation-levels': {
    id: '03-03',
    slug: 'isolation-levels',
    chapterId: 3,
    order: 3,
    title: 'Transaction Isolation Levels',
    description: 'Understand and configure isolation levels to prevent data anomalies.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.sqlalchemy],
    prerequisites: ['03-02'],
    objectives: [
      'Explain Read Committed vs Repeatable Read vs Serializable',
      'Set isolation levels per transaction in SQLAlchemy',
      'Choose the right isolation level for each use case',
      'Understand the performance vs correctness tradeoff'
    ],
    sections: [
      {
        id: '03-03-sec1',
        type: 'concept',
        title: 'Understanding Anomalies and Isolation',
        content: `Database isolation levels exist to prevent phenomena like Dirty Reads, Non-Repeatable Reads, and Phantom Reads. PostgreSQL defaults to **Read Committed**, meaning a query only sees data committed before the query began. However, if two concurrent transactions modify the same data, one might overwrite the other (Lost Update) depending on how the application reads and writes.\n\nHigher isolation levels, like **Repeatable Read** and **Serializable**, provide stronger guarantees but come with a cost: increased locking, higher chance of transaction rollbacks (Serialization Failures), and reduced concurrency.`
      },
      {
        id: '03-03-sec2',
        type: 'implementation',
        title: 'Setting Isolation Levels in SQLAlchemy',
        content: `You can configure isolation levels at the engine level, or per-session. For critical operations like financial transactions, you might elevate the isolation level temporarily using \`execution_options\`.`,
        codeExample: {
          id: '03-03-code1',
          language: 'python',
          title: 'Elevating Isolation Level',
          files: {
            'app/services.py': {
              language: 'python',
              code: `async def process_payout(session: AsyncSession, user_id: int):\n    # Elevate to Repeatable Read for this specific transaction\n    await session.connection(execution_options={"isolation_level": "REPEATABLE READ"})\n    async with session.begin():\n        result = await session.execute(select(User).where(User.id == user_id))\n        user = result.scalar_one()\n        # Process logic here...`
            }
          }
        }
      },
      {
        id: '03-03-sec3',
        type: 'architecture',
        title: 'Handling Serialization Failures',
        content: `When using Repeatable Read or Serializable, PostgreSQL will aggressively abort transactions if it detects an anomaly (e.g., \`could not serialize access due to concurrent update\`). Your application must be prepared to catch these \`SerializationFailure\` exceptions and retry the transaction.`
      }
    ],
    codeExamples: [
      {
        id: '03-03-example1',
        title: 'Retry Logic for Serialization Failures',
        files: {
          'app/utils.py': {
            language: 'python',
            code: `from sqlalchemy.exc import DBAPIError\nimport asyncio\n\nasync def with_retry(session, func, *args, retries=3):\n    for attempt in range(retries):\n        try:\n            return await func(session, *args)\n        except DBAPIError as e:\n            # 40001 is the Postgres error code for serialization failure\n            if e.orig.pgcode == '40001':\n                await session.rollback()\n                await asyncio.sleep(0.1 * (attempt + 1))\n                continue\n            raise\n    raise Exception("Max retries exceeded")`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-03-chal1',
        title: 'Preventing Lost Updates',
        description: 'Explain how to prevent a lost update in Read Committed mode without changing the isolation level.',
        hint: 'Consider using row-level locking.',
        solution: 'Use SELECT ... FOR UPDATE via with_for_update() in SQLAlchemy.',
        solutionCode: {
          id: '03-03-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'query.py',
          code: `stmt = select(Account).where(Account.id == 1).with_for_update()\nresult = await session.execute(stmt)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-03-int1',
        question: 'What is a Phantom Read, and which isolation level prevents it in PostgreSQL?',
        answer: 'A phantom read occurs when a transaction reads a set of rows matching a condition, and another transaction inserts a new row matching that condition before the first transaction finishes. In PostgreSQL, Repeatable Read actually prevents phantom reads (unlike the SQL standard which only requires Serializable to prevent it).',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-03-prod1',
        severity: 'warning',
        content: 'Do not set the global engine isolation level to Serializable unless your framework has robust, automatic transaction retry mechanisms built-in for every request.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-03-rw1',
        scenario: 'Race Condition in Wallet Balance',
        problem: 'Two concurrent requests debited a user balance simultaneously. Both read a balance of $100, debited $60, and saved $40. The user spent $120 total but had $40 remaining.',
        solution: 'Implemented SELECT FOR UPDATE (row-level locking) during the balance check, forcing the second transaction to wait for the first to complete.'
      }
    ],
    commonMistakes: [
      {
        id: '03-03-mistake1',
        title: 'Assuming Default Prevents Race Conditions',
        description: 'Developers assume Read Committed prevents concurrent overwrites (Lost Updates).',
        badCode: {
          id: '03-03-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `user = await session.get(User, 1)\nuser.balance -= 10 # Vulnerable to race conditions`
        },
        goodCode: {
          id: '03-03-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `stmt = update(User).where(User.id == 1).values(balance=User.balance - 10)`
        }
      }
    ]
  },
  'index-strategies': {
    id: '03-04',
    slug: 'index-strategies',
    chapterId: 3,
    order: 4,
    title: 'Index Strategies & Query Optimization',
    description: 'Design effective PostgreSQL indexes and kill sequential scans.',
    duration: 55,
    difficulty: 'advanced',
    technologies: [technologies.postgresql],
    prerequisites: ['03-03'],
    objectives: [
      'Choose between B-tree, Hash, GIN, and BRIN indexes',
      'Create composite and partial indexes',
      'Analyze queries with EXPLAIN ANALYZE',
      'Identify and fix sequential scans'
    ],
    sections: [
      {
        id: '03-04-sec1',
        type: 'concept',
        title: 'Beyond the Basic B-Tree',
        content: `While PostgreSQL defaults to B-Tree indexes (perfect for equality and range queries), real-world scaling requires advanced index types. **GIN (Generalized Inverted Index)** is essential for full-text search and JSONB arrays. **BRIN (Block Range Index)** is highly efficient for massive time-series data where data is naturally ordered (like log timestamps), as it stores ranges of blocks rather than every row, saving massive disk space.\n\nFurthermore, adding an index is not free. Every INSERT and UPDATE carries overhead. Therefore, creating highly specific **Partial Indexes** (indexing only a subset of data) or **Composite Indexes** (indexing multiple columns used together) is key to optimal performance.`
      },
      {
        id: '03-04-sec2',
        type: 'implementation',
        title: 'Declaring Advanced Indexes in SQLAlchemy',
        content: `SQLAlchemy's \`Index\` construct allows you to define complex indexes directly in your models, including partial conditions and specific indexing methods.`,
        codeExample: {
          id: '03-04-code1',
          language: 'python',
          title: 'Partial and Composite Indexes',
          files: {
            'app/models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, Integer, String, Boolean, Index\nfrom sqlalchemy.orm import declarative_base\n\nBase = declarative_base()\n\nclass Task(Base):\n    __tablename__ = 'tasks'\n    id = Column(Integer, primary_key=True)\n    user_id = Column(Integer)\n    status = Column(String)\n    is_deleted = Column(Boolean, default=False)\n\n    __table_args__ = (\n        # Composite index for filtering by user and status\n        Index('ix_tasks_user_status', 'user_id', 'status'),\n        # Partial index: only index rows where is_deleted is False\n        Index('ix_active_tasks', 'status', postgresql_where=(is_deleted == False)),\n    )`
            }
          }
        }
      },
      {
        id: '03-04-sec3',
        type: 'production',
        title: 'EXPLAIN ANALYZE',
        content: `You cannot optimize what you do not measure. \`EXPLAIN ANALYZE\` is your primary tool for diagnosing slow queries. It executes the query and returns the actual execution plan, showing Node Types (Seq Scan, Index Scan, Bitmap Heap Scan), estimated vs actual rows, and execution time. A "Seq Scan" on a million-row table is a red flag that an index is missing or the planner chose not to use it (often due to outdated statistics).`
      }
    ],
    codeExamples: [
      {
        id: '03-04-example1',
        title: 'Analyzing a Query',
        files: {
          'db/analyze.sql': {
            language: 'sql',
            code: `EXPLAIN ANALYZE \nSELECT * FROM tasks WHERE user_id = 123 AND status = 'PENDING';\n\n-- Look for "Index Scan using ix_tasks_user_status on tasks"`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-04-chal1',
        title: 'Optimize the Soft-Delete Query',
        description: 'You have a table with 10 million rows, 9.9 million of which have `archived=True`. Your query `SELECT * FROM data WHERE archived=False AND type="REPORT"` is slow. Design an index.',
        hint: 'Use a partial index to ignore archived rows.',
        solution: 'A partial index on `type` where `archived` is false is extremely small and fast.',
        solutionCode: {
          id: '03-04-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'model.py',
          code: `Index('ix_unarchived_type', 'type', postgresql_where=(archived == False))`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-04-int1',
        question: 'Why might PostgreSQL choose a Sequential Scan even when an index exists?',
        answer: 'PostgreSQL relies on statistics (pg_statistic). If it estimates that a query will return a large percentage of the table (e.g., > 15-20%), it determines that sequentially reading the disk pages is actually faster than doing random I/O index lookups for every row.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-04-prod1',
        severity: 'critical',
        content: 'Always create indexes CONCURRENTLY in production to avoid locking the table for writes during index creation.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-04-rw1',
        scenario: 'The Boolean Index Trap',
        problem: 'A developer added a B-Tree index on an `is_active` boolean column. The index took up memory but was never used by the planner because it only had two distinct values, offering poor selectivity.',
        solution: 'Replaced it with a partial index that only indexed the minority value (e.g., active accounts), reducing index size by 90% and making it usable.'
      }
    ],
    commonMistakes: [
      {
        id: '03-04-mistake1',
        title: 'Over-Indexing',
        description: 'Adding single-column indexes on every field in a table slows down writes drastically without helping complex queries.',
        badCode: {
          id: '03-04-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `id = Column(Integer, index=True)\nname = Column(String, index=True)\nstatus = Column(String, index=True)`
        },
        goodCode: {
          id: '03-04-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `# Analyze query patterns and create composite/partial indexes as needed`
        }
      }
    ]
  },
  'connection-pooling': {
    id: '03-05',
    slug: 'connection-pooling',
    chapterId: 3,
    order: 5,
    title: 'Connection Pooling with asyncpg & pgBouncer',
    description: 'Scale database connections efficiently with pooling strategies.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.postgresql, technologies.python],
    prerequisites: ['03-01'],
    objectives: [
      'Configure SQLAlchemy async engine pool settings',
      'Understand pool_size, max_overflow, and pool_timeout',
      'Use pgBouncer for external connection pooling',
      'Monitor connection pool health'
    ],
    sections: [
      {
        id: '03-05-sec1',
        type: 'concept',
        title: 'The Connection Limit Problem',
        content: `PostgreSQL handles each connection by spawning a new OS process, consuming ~10MB of RAM per connection. Out of the box, Postgres usually maxes out around 100 connections. When a high-concurrency FastAPI app receives thousands of requests, opening a new database connection for each request is disastrously slow and will instantly exhaust the database connection limits.\n\nConnection pooling solves this by keeping a cache of persistent database connections. When FastAPI needs to query the DB, it borrows an existing connection from the pool, uses it, and returns it. This happens at two levels: application-level (SQLAlchemy) and infrastructure-level (PgBouncer).`
      },
      {
        id: '03-05-sec2',
        type: 'implementation',
        title: 'Application-Level Pooling (SQLAlchemy)',
        content: `SQLAlchemy has a built-in \`QueuePool\`. For async applications, tuning \`pool_size\` and \`max_overflow\` is critical. \`pool_size\` is the baseline number of connections kept open, while \`max_overflow\` is how many extra connections can be created during bursts.`,
        codeExample: {
          id: '03-05-code1',
          language: 'python',
          title: 'SQLAlchemy Pool Config',
          files: {
            'app/database.py': {
              language: 'python',
              code: `from sqlalchemy.ext.asyncio import create_async_engine\n\nengine = create_async_engine(\n    "postgresql+asyncpg://user:pass@db:5432/db",\n    pool_size=20,          # Base number of connections\n    max_overflow=10,       # Allow up to 30 during spikes\n    pool_timeout=30,       # Seconds to wait for an available connection\n    pool_recycle=1800,     # Reconnect after 30 mins to prevent stale connections\n    pool_pre_ping=True     # Check if connection is alive before using it\n)`
            }
          }
        }
      },
      {
        id: '03-05-sec3',
        type: 'architecture',
        title: 'Infrastructure-Level Pooling (PgBouncer)',
        content: `When scaling out FastAPI to multiple pods/workers, application-level pooling isn't enough (e.g., 10 pods * 20 pool_size = 200 connections, crashing Postgres). **PgBouncer** sits between your app and PostgreSQL. It holds a small pool of actual Postgres connections, but accepts thousands of connections from FastAPI.\n\nFor PgBouncer to work seamlessly with SQLAlchemy, PgBouncer is typically configured in **Transaction Mode**. However, asyncpg utilizes prepared statements heavily, which conflict with transaction mode. Therefore, you must configure SQLAlchemy/asyncpg to disable prepared statements when talking to PgBouncer.`
      }
    ],
    codeExamples: [
      {
        id: '03-05-example1',
        title: 'PgBouncer Compatibility',
        files: {
          'app/database.py': {
            language: 'python',
            code: `engine = create_async_engine(\n    "postgresql+asyncpg://user:pass@pgbouncer:6432/db",\n    # Disable prepared statements for PgBouncer Transaction Mode\n    connect_args={"prepared_statement_cache_size": 0},\n)`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-05-chal1',
        title: 'Configure PgBouncer Connection',
        description: 'Modify a create_async_engine call to be compatible with a PgBouncer running in transaction pooling mode.',
        hint: 'Use connect_args to set prepared_statement_cache_size to 0.',
        solution: 'Disabling the statement cache prevents asyncpg from relying on session-bound prepared statements.',
        solutionCode: {
          id: '03-05-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'db.py',
          code: `engine = create_async_engine(URL, connect_args={"prepared_statement_cache_size": 0})`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-05-int1',
        question: 'Why does PgBouncer Transaction Mode break asyncpg prepared statements?',
        answer: 'In transaction mode, PgBouncer assigns a server connection for the duration of a transaction, not a session. A prepared statement created on one server connection might be accessed in a later transaction that gets assigned a different server connection, resulting in a "prepared statement does not exist" error.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-05-prod1',
        severity: 'info',
        content: 'pool_pre_ping=True adds a slight overhead to every checkout, but is highly recommended in production to gracefully handle database restarts or killed connections.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-05-rw1',
        scenario: 'Kubernetes Autoscaling Outage',
        problem: 'During a traffic spike, K8s scaled the FastAPI pods from 5 to 50. Each pod had a pool_size of 20. The sudden 1000 connection requests caused the PostgreSQL server to hit its max_connections limit and crash.',
        solution: 'Introduced PgBouncer as a centralized sidecar. Pods connected to PgBouncer, which multiplexed the 1000 app connections into 50 actual Postgres connections.'
      }
    ],
    commonMistakes: [
      {
        id: '03-05-mistake1',
        title: 'Infinite Pool Timeout',
        description: 'Not setting a pool timeout can cause the application to hang indefinitely if all connections are checked out and never returned.',
        badCode: {
          id: '03-05-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `pool_timeout=None`
        },
        goodCode: {
          id: '03-05-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `pool_timeout=30 # Fail fast if DB is unreachable`
        }
      }
    ]
  },
  'alembic-migrations': {
    id: '03-06',
    slug: 'alembic-migrations',
    chapterId: 3,
    order: 6,
    title: 'Database Migrations with Alembic',
    description: 'Manage schema evolution with async SQLAlchemy and Alembic.',
    duration: 50,
    difficulty: 'advanced',
    technologies: [technologies.alembic, technologies.postgresql],
    prerequisites: ['03-01'],
    objectives: [
      'Initialize Alembic with async SQLAlchemy',
      'Write reversible migration scripts',
      'Apply zero-downtime migration strategies',
      'Test migrations in CI before deploying'
    ],
    sections: [
      {
        id: '03-06-sec1',
        type: 'concept',
        title: 'Infrastructure as Code for Databases',
        content: `Alembic tracks database schema changes over time, acting like Git for your database. As you update your SQLAlchemy models, Alembic auto-generates migration scripts (Upgrades and Downgrades). Managing migrations properly is essential to prevent data loss and ensure deployments run smoothly.\n\nSetting up Alembic with \`asyncpg\` requires a specific configuration because Alembic itself relies on synchronous execution to introspect the database. We must configure the \`env.py\` file to bridge the async engine with Alembic's sync requirements.`
      },
      {
        id: '03-06-sec2',
        type: 'implementation',
        title: 'Async Alembic Configuration',
        content: `When initializing Alembic, you need to modify \`env.py\` to use an async run environment. This involves importing your Base metadata and modifying \`run_migrations_online\` to run within an asyncio loop.`,
        codeExample: {
          id: '03-06-code1',
          language: 'python',
          title: 'env.py Async Setup',
          files: {
            'alembic/env.py': {
              language: 'python',
              code: `import asyncio\nfrom sqlalchemy.ext.asyncio import async_engine_from_config\nfrom app.database import Base\n\ntarget_metadata = Base.metadata\n\ndef do_run_migrations(connection):\n    context.configure(connection=connection, target_metadata=target_metadata)\n    with context.begin_transaction():\n        context.run_migrations()\n\nasync def run_async_migrations():\n    connectable = async_engine_from_config(\n        config.get_section(config.config_ini_section),\n        prefix="sqlalchemy.",\n        poolclass=pool.NullPool,\n    )\n    async with connectable.connect() as connection:\n        await connection.run_sync(do_run_migrations)\n\ndef run_migrations_online():\n    asyncio.run(run_async_migrations())`
            }
          }
        }
      },
      {
        id: '03-06-sec3',
        type: 'production',
        title: 'Zero-Downtime Migrations',
        content: `In production, you cannot simply drop a column or rename a table without causing application errors during the deployment window. A zero-downtime migration strategy requires multiple steps: \n1. Add the new column/table.\n2. Deploy app code that writes to both old and new columns.\n3. Backfill data.\n4. Deploy app code that reads from the new column.\n5. Remove the old column in a future migration.`
      }
    ],
    codeExamples: [
      {
        id: '03-06-example1',
        title: 'Migration Script Generation',
        files: {
          'bash': {
            language: 'bash',
            code: `# Generate a migration automatically based on model changes\nalembic revision --autogenerate -m "add_user_status"\n\n# Apply migrations\nalembic upgrade head`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-06-chal1',
        title: 'Write a Data Backfill Migration',
        description: 'You added a new `fullname` column. Write an Alembic upgrade function that concatenates existing `first_name` and `last_name` into `fullname`.',
        hint: 'Use the op.execute() function to run raw SQL.',
        solution: 'Raw SQL is the safest and fastest way to backfill data during a migration.',
        solutionCode: {
          id: '03-06-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'migration.py',
          code: `def upgrade():\n    # Schema change\n    op.add_column('users', sa.Column('fullname', sa.String(), nullable=True))\n    # Data migration\n    op.execute("UPDATE users SET fullname = first_name || ' ' || last_name")\n    # Enforce constraint\n    op.alter_column('users', 'fullname', nullable=False)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-06-int1',
        question: 'Why should you review Alembic autogenerated scripts before running them?',
        answer: 'Alembic autogenerate is not perfect. It cannot reliably detect table or column renames (it usually interprets them as a drop and a create, causing data loss). It also does not handle complex constraint changes perfectly.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: '03-06-prod1',
        severity: 'critical',
        content: 'Never use autogenerate in a CI/CD pipeline directly. Autogenerate is a local development tool. The resulting static migration file should be committed to Git.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-06-rw1',
        scenario: 'The Table Rename Catastrophe',
        problem: 'A developer renamed a model from `Account` to `UserAccount`. Alembic autogenerate created a script that dropped the `account` table and created a new `user_account` table. The developer applied it to production, instantly dropping all user data.',
        solution: 'The team restored from a backup. The migration was rewritten manually using op.rename_table("account", "user_account") to preserve the data.'
      }
    ],
    commonMistakes: [
      {
        id: '03-06-mistake1',
        title: 'Running Migrations on Application Startup',
        description: 'Running alembic upgrade head automatically in the FastAPI startup event can cause race conditions if multiple pods start simultaneously.',
        badCode: {
          id: '03-06-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `@app.on_event("startup")\nasync def startup():\n    # Runs on every pod simultaneously\n    alembic.command.upgrade(config, "head")`
        },
        goodCode: {
          id: '03-06-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `# Run migrations as a separate step in your CI/CD pipeline or init-container, before the app deployment.`
        }
      }
    ]
  },
  'n-plus-one-queries': {
    id: '03-07',
    slug: 'n-plus-one-queries',
    chapterId: 3,
    order: 7,
    title: 'Solving the N+1 Query Problem',
    description: 'Eliminate database round-trips using Eager Loading strategies.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.sqlalchemy, technologies.postgresql],
    prerequisites: ['03-01'],
    objectives: [
      'Detect N+1 queries with SQL logging',
      'Use selectinload and joinedload eagerly',
      'Design queries to fetch related data in bulk',
      'Measure query count in tests'
    ],
    sections: [
      {
        id: '03-07-sec1',
        type: 'concept',
        title: 'The Silent Performance Killer',
        content: `The N+1 query problem occurs when an application executes 1 query to fetch a list of N parent records, and then executes N additional queries to fetch the related child records for each parent. In async applications, lazy loading is disabled, which ironically protects you from accidental N+1 queries by raising an error. However, developers often bypass this by issuing explicit queries in loops.\n\nTo solve this, SQLAlchemy provides Eager Loading strategies. By telling SQLAlchemy upfront what related data we need, it can fetch everything in 1 or 2 optimized queries.`
      },
      {
        id: '03-07-sec2',
        type: 'implementation',
        title: 'joinedload vs selectinload',
        content: `There are two primary eager loading strategies: \n- **joinedload()**: Emits a SQL JOIN. Best for many-to-one or one-to-one relationships. If used on collections (one-to-many), it can result in Cartesian products and massive data duplication over the wire.\n- **selectinload()**: Emits a second SELECT statement with an IN clause containing the parent IDs. This is the recommended approach for loading collections (one-to-many, many-to-many) as it is memory efficient and scales well.`,
        codeExample: {
          id: '03-07-code1',
          language: 'python',
          title: 'Eager Loading Data',
          files: {
            'app/repositories.py': {
              language: 'python',
              code: `from sqlalchemy.orm import selectinload, joinedload\n\nasync def get_users_with_posts(session: AsyncSession):\n    # selectinload for one-to-many (User -> Posts)\n    stmt = select(User).options(selectinload(User.posts))\n    result = await session.execute(stmt)\n    return result.scalars().all()\n\nasync def get_posts_with_authors(session: AsyncSession):\n    # joinedload for many-to-one (Post -> Author)\n    stmt = select(Post).options(joinedload(Post.author))\n    result = await session.execute(stmt)\n    return result.scalars().all()`
            }
          }
        }
      },
      {
        id: '03-07-sec3',
        type: 'architecture',
        title: 'Testing for N+1 Queries',
        content: `In a robust CI pipeline, you should write tests that assert the number of database queries executed during an API request. This guarantees that refactoring won't accidentally introduce N+1 regressions.`
      }
    ],
    codeExamples: [
      {
        id: '03-07-example1',
        title: 'Query Count Assertion',
        files: {
          'tests/test_api.py': {
            language: 'python',
            code: `async def test_get_users_endpoint(client, db_session, assert_query_count):\n    # Setup data\n    await create_dummy_users(db_session, count=100)\n    \n    # assert_query_count is a custom pytest fixture that inspects engine events\n    with assert_query_count(2): # 1 for users, 1 for selectinload posts\n        response = await client.get("/users")\n        \n    assert response.status_code == 200`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-07-chal1',
        title: 'Fix the N+1 Loop',
        description: 'A developer wrote: `for user in users: profile = await session.get(Profile, user.profile_id)`. Rewrite this using ORM eager loading.',
        hint: 'Use select() with joinedload().',
        solution: 'Use options(joinedload(User.profile)) in the initial query.',
        solutionCode: {
          id: '03-07-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'fix.py',
          code: `stmt = select(User).options(joinedload(User.profile))\nresult = await session.execute(stmt)\nusers = result.scalars().all()`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-07-int1',
        question: 'Why is joinedload dangerous for one-to-many relationships?',
        answer: 'joinedload uses a LEFT OUTER JOIN. If a parent has 1000 children, the parent data is duplicated 1000 times in the SQL result set. This wastes network bandwidth and application memory when SQLAlchemy deduplicates the rows in Python.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: '03-07-prod1',
        severity: 'info',
        content: 'Turn on SQL echoing (echo=True in engine) in development. Visually inspecting the terminal output is the fastest way to spot repetitive queries.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-07-rw1',
        scenario: 'The 5-Second Page Load',
        problem: 'An admin dashboard took 5 seconds to load a list of 50 orders. Analysis showed it was executing 1 query for orders, 50 queries for customers, and 150 queries for order items.',
        solution: 'Applied a single selectinload for items and joinedload for customers, reducing 201 queries to 2 queries and page load to 100ms.'
      }
    ],
    commonMistakes: [
      {
        id: '03-07-mistake1',
        title: 'Ignoring Eager Loading in Serialization',
        description: 'Pydantic models that reference relationship fields will trigger errors or N+1 queries if the data was not eagerly loaded.',
        badCode: {
          id: '03-07-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `stmt = select(User)\nusers = await session.execute(stmt)\nreturn [UserSchema.model_validate(u) for u in users] # Schema needs u.posts`
        },
        goodCode: {
          id: '03-07-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `stmt = select(User).options(selectinload(User.posts))\n# Now validation succeeds without extra queries`
        }
      }
    ]
  },
  'cursor-pagination': {
    id: '03-08',
    slug: 'cursor-pagination',
    chapterId: 3,
    order: 8,
    title: 'Cursor-Based Pagination',
    description: 'Implement high-performance pagination that scales to millions of rows.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['03-04'],
    objectives: [
      'Understand why offset pagination fails at scale',
      'Implement keyset/cursor pagination',
      'Return opaque pagination cursors',
      'Handle edge cases (deleted items, sort changes)'
    ],
    sections: [
      {
        id: '03-08-sec1',
        type: 'concept',
        title: 'The OFFSET / LIMIT Problem',
        content: `Traditional pagination uses \`LIMIT 10 OFFSET 1000\`. This tells the database to find 1010 rows, drop the first 1000, and return the last 10. As the offset grows (e.g., page 50,000), the database still has to scan and discard all preceding rows. This results in terrible performance for deep pagination.\n\nCursor-based (or Keyset) pagination uses a deterministic anchor (the cursor). Instead of skipping rows, it asks the database: "Give me the next 10 items whose ID is strictly greater than the last ID I saw." With a proper index, the database jumps directly to that row in O(log N) time.`
      },
      {
        id: '03-08-sec2',
        type: 'implementation',
        title: 'Implementing Keyset Pagination',
        content: `To implement cursor pagination, you need a stable sorting column (usually a sequential ID or a timestamp paired with a UUID to resolve ties). You base64-encode this value to create an opaque cursor string for the client.`,
        codeExample: {
          id: '03-08-code1',
          language: 'python',
          title: 'Cursor Pagination Query',
          files: {
            'app/repositories.py': {
              language: 'python',
              code: `import base64\n\nasync def get_messages(session, limit: int = 20, cursor: str = None):\n    stmt = select(Message).order_by(Message.id.desc()).limit(limit)\n    \n    if cursor:\n        # Decode cursor to get the last seen ID\n        last_id = int(base64.b64decode(cursor).decode())\n        stmt = stmt.where(Message.id < last_id)\n        \n    result = await session.execute(stmt)\n    messages = list(result.scalars().all())\n    \n    next_cursor = None\n    if messages:\n        last_msg = messages[-1]\n        next_cursor = base64.b64encode(str(last_msg.id).encode()).decode()\n        \n    return messages, next_cursor`
            }
          }
        }
      },
      {
        id: '03-08-sec3',
        type: 'architecture',
        title: 'Handling Complex Sorting',
        content: `If you sort by a non-unique column (like \`created_at\`), two rows might have the exact same timestamp. If the page breaks between them, the second row might be skipped. You must always use a tie-breaker column (like \`id\`) in your ORDER BY and cursor.`
      }
    ],
    codeExamples: [
      {
        id: '03-08-example1',
        title: 'Complex Cursor Query',
        files: {
          'app/query.py': {
            language: 'python',
            code: `# Sorting by created_at DESC, id DESC\nstmt = select(Post).where(\n    (Post.created_at < last_created_at) | \n    ((Post.created_at == last_created_at) & (Post.id < last_id))\n).order_by(Post.created_at.desc(), Post.id.desc()).limit(20)`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-08-chal1',
        title: 'Base64 Cursor Utility',
        description: 'Create a utility function to encode and decode a dictionary cursor containing `{"date": "2024-01-01", "id": 5}` into a url-safe base64 string.',
        hint: 'Use json.dumps and base64.urlsafe_b64encode.',
        solution: 'Encoding complex states in a dict allows flexible cursors.',
        solutionCode: {
          id: '03-08-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'utils.py',
          code: `import json\nimport base64\n\ndef encode_cursor(data: dict) -> str:\n    json_str = json.dumps(data)\n    return base64.urlsafe_b64encode(json_str.encode()).decode()\n\ndef decode_cursor(token: str) -> dict:\n    json_str = base64.urlsafe_b64decode(token.encode()).decode()\n    return json.loads(json_str)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-08-int1',
        question: 'Why do clients sometimes prefer offset pagination over cursor pagination?',
        answer: 'Offset pagination allows jumping to a specific page (e.g., "Page 10") directly. Cursor pagination only allows moving forward or backward sequentially. It also provides a total page count easily.',
        difficulty: 'intermediate'
      }
    ],
    productionNotes: [
      {
        id: '03-08-prod1',
        severity: 'info',
        content: 'Cursor pagination inherently solves the "missing item" glitch that occurs in offset pagination when items are inserted or deleted while a user is paginating.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-08-rw1',
        scenario: 'Infinite Scroll Timeout',
        problem: 'A social feed using offset pagination started timing out for users scrolling past the 500th item. Database CPU spiked due to massive sequential scanning.',
        solution: 'Switched to cursor pagination using the post ID. Database lookup time became constant (O(1) index lookup) regardless of scroll depth.'
      }
    ],
    commonMistakes: [
      {
        id: '03-08-mistake1',
        title: 'Missing Tie-Breaker',
        description: 'Sorting by a non-unique column without a tie-breaker leads to dropped records.',
        badCode: {
          id: '03-08-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `stmt = select(User).where(User.score < last_score).order_by(User.score.desc())`
        },
        goodCode: {
          id: '03-08-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `stmt = select(User).where(\n    (User.score < last_score) | ((User.score == last_score) & (User.id < last_id))\n).order_by(User.score.desc(), User.id.desc())`
        }
      }
    ]
  },
  'bulk-operations': {
    id: '03-09',
    slug: 'bulk-operations',
    chapterId: 3,
    order: 9,
    title: 'Bulk Insert, Update & Delete',
    description: 'Process thousands of records instantly using native bulk operations.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.sqlalchemy, technologies.postgresql],
    prerequisites: ['03-01'],
    objectives: [
      'Use insert().values() for bulk inserts',
      'Implement bulk updates with UPDATE...FROM',
      'Use COPY command for massive data loads',
      'Benchmark bulk vs row-by-row operations'
    ],
    sections: [
      {
        id: '03-09-sec1',
        type: 'concept',
        title: 'The Cost of ORM Overhead',
        content: `Adding records to a session via \`session.add()\` and committing works fine for small batches. But for processing CSV uploads, data migrations, or webhook payloads containing thousands of records, ORM instantiation and session tracking overhead becomes a massive bottleneck.\n\nSQLAlchemy provides Core-level execution methods that bypass the ORM state machine entirely, sending heavily optimized bulk SQL statements directly to the database. For extreme cases, PostgreSQL's native \`COPY\` command can stream megabytes of data directly into a table.`
      },
      {
        id: '03-09-sec2',
        type: 'implementation',
        title: 'Bulk Inserts and Updates',
        content: `Use the \`insert()\` construct with a list of dictionaries for lightning-fast bulk inserts. For bulk updates, you can pass a list of dictionaries to a \`session.execute(update())\` call, or use a complex \`UPDATE ... FROM\` clause.`,
        codeExample: {
          id: '03-09-code1',
          language: 'python',
          title: 'Bulk Insert Executemany',
          files: {
            'app/services.py': {
              language: 'python',
              code: `from sqlalchemy import insert, update\n\nasync def bulk_create_users(session: AsyncSession, users_data: list[dict]):\n    # Executes a single INSERT statement with multiple values\n    stmt = insert(User)\n    await session.execute(stmt, users_data)\n\nasync def bulk_update_status(session: AsyncSession, update_data: list[dict]):\n    # update_data = [{"id": 1, "status": "active"}, {"id": 2, "status": "banned"}]\n    stmt = update(User)\n    # SQLAlchemy detects the 'id' primary key and constructs an executemany update\n    await session.execute(stmt, update_data)`
            }
          }
        }
      },
      {
        id: '03-09-sec3',
        type: 'architecture',
        title: 'The COPY Command',
        content: `For inserting millions of rows, even bulk INSERTs can be slow. PostgreSQL's \`COPY\` command reads from a file or a stream directly. With \`asyncpg\`, you can stream data directly from Python memory into Postgres using \`copy_records_to_table\`.`
      }
    ],
    codeExamples: [
      {
        id: '03-09-example1',
        title: 'Using COPY with asyncpg',
        files: {
          'app/services.py': {
            language: 'python',
            code: `async def copy_massive_data(session: AsyncSession, records: list[tuple]):\n    # We need the underlying raw asyncpg connection\n    connection = await session.connection()\n    raw_conn = await connection.get_raw_connection()\n    driver_conn = raw_conn.driver_connection\n    \n    await driver_conn.copy_records_to_table(\n        'users',\n        columns=['email', 'password_hash'],\n        records=records\n    )`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-09-chal1',
        title: 'Upserting Data',
        description: 'Write a query that inserts a list of users, but if the email already exists, it updates their `last_login` timestamp.',
        hint: 'Use PostgreSQLs ON CONFLICT DO UPDATE functionality (INSERT ... ON CONFLICT).',
        solution: 'SQLAlchemy provides postgresql.insert for dialect-specific upserts.',
        solutionCode: {
          id: '03-09-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'upsert.py',
          code: `from sqlalchemy.dialects.postgresql import insert\n\nstmt = insert(User).values(data)\nstmt = stmt.on_conflict_do_update(\n    index_elements=['email'],\n    set_={'last_login': stmt.excluded.last_login}\n)\nawait session.execute(stmt)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-09-int1',
        question: 'Why do ORM hooks/events (like before_insert) not trigger during bulk Core operations?',
        answer: 'Bulk operations bypass the ORM layer and session state tracking entirely to achieve their speed. Since the objects are not instantiated into Python memory, the ORM events attached to the models are never fired.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: '03-09-prod1',
        severity: 'critical',
        content: 'When using bulk updates/deletes, ensure you synchronize the session using execution_options(synchronize_session=False) if you do not need the current Python objects updated in memory, saving significant CPU overhead.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-09-rw1',
        scenario: 'The 20-Minute CSV Upload',
        problem: 'A nightly job uploading 100,000 rows via session.add() was taking 20 minutes and causing memory bloat in the pod.',
        solution: 'Refactored to use asyncpgs copy_records_to_table, reducing the upload time from 20 minutes to 4 seconds.'
      }
    ],
    commonMistakes: [
      {
        id: '03-09-mistake1',
        title: 'Looping session.commit()',
        description: 'Committing inside a loop for batch processing destroys performance due to transaction overhead.',
        badCode: {
          id: '03-09-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `for user in users:\n    session.add(user)\n    await session.commit()`
        },
        goodCode: {
          id: '03-09-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `session.add_all(users)\nawait session.commit() # Or use bulk insert`
        }
      }
    ]
  },
  'constraints-data-integrity': {
    id: '03-10',
    slug: 'constraints-data-integrity',
    chapterId: 3,
    order: 10,
    title: 'Constraints & Data Integrity',
    description: 'Enforce business rules securely at the database level.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.postgresql, technologies.sqlalchemy],
    prerequisites: ['03-01'],
    objectives: [
      'Use CHECK, UNIQUE, NOT NULL, and FK constraints',
      'Implement deferrable constraints',
      'Handle constraint violations in SQLAlchemy',
      'Use database-level uniqueness for race condition safety'
    ],
    sections: [
      {
        id: '03-10-sec1',
        type: 'concept',
        title: 'Database as the Source of Truth',
        content: `Application-level validation (like Pydantic) is great for user feedback, but it is fundamentally vulnerable to race conditions. If two requests concurrently validate that an email is unique in Python, both will pass, and both will attempt to insert it. \n\nOnly the database can guarantee true data integrity under concurrent load. **UNIQUE**, **CHECK**, and **FOREIGN KEY** constraints act as the final, unbreakable firewall guarding your business rules.`
      },
      {
        id: '03-10-sec2',
        type: 'implementation',
        title: 'Implementing Constraints in SQLAlchemy',
        content: `Constraints are defined in the \`__table_args__\` tuple of your SQLAlchemy model. You should always name your constraints explicitly; otherwise, PostgreSQL generates random names, making error handling and future migrations incredibly difficult.`,
        codeExample: {
          id: '03-10-code1',
          language: 'python',
          title: 'Model Constraints',
          files: {
            'app/models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, Integer, String, CheckConstraint, UniqueConstraint\n\nclass Product(Base):\n    __tablename__ = 'products'\n    id = Column(Integer, primary_key=True)\n    sku = Column(String)\n    price = Column(Integer)\n    discount = Column(Integer)\n\n    __table_args__ = (\n        UniqueConstraint('sku', name='uq_product_sku'),\n        CheckConstraint('price > 0', name='chk_product_price_positive'),\n        CheckConstraint('discount < price', name='chk_product_discount_valid'),\n    )`
            }
          }
        }
      },
      {
        id: '03-10-sec3',
        type: 'production',
        title: 'Handling IntegrityErrors Gracefully',
        content: `When a constraint is violated, SQLAlchemy raises an \`IntegrityError\`. Your FastAPI application should catch these errors, inspect the constraint name or PostgreSQL error code, and return a clean HTTP 400 or 409 response to the client rather than an unhandled 500.`
      }
    ],
    codeExamples: [
      {
        id: '03-10-example1',
        title: 'Catching Constraint Errors',
        files: {
          'app/api.py': {
            language: 'python',
            code: `from sqlalchemy.exc import IntegrityError\nfrom fastapi import HTTPException\n\n@app.post("/products")\nasync def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):\n    try:\n        db.add(Product(**product.dict()))\n        await db.commit()\n    except IntegrityError as e:\n        await db.rollback()\n        if 'uq_product_sku' in str(e.orig):\n            raise HTTPException(status_code=409, detail="SKU already exists")\n        raise HTTPException(status_code=400, detail="Data validation failed")`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-10-chal1',
        title: 'Conditional Unique Constraint',
        description: 'You have a User table where `username` must be unique, but ONLY if the user is not deleted (`is_deleted = False`).',
        hint: 'You cannot use a simple UniqueConstraint for this. You need a unique index with a condition.',
        solution: 'Use a partial unique index.',
        solutionCode: {
          id: '03-10-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'models.py',
          code: `Index('uq_active_username', 'username', unique=True, postgresql_where=(is_deleted == False))`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-10-int1',
        question: 'What is a deferrable constraint and when would you use it?',
        answer: 'A deferrable constraint (like a Foreign Key) checks for validity at the end of the transaction instead of immediately after the statement. This is useful when doing complex data loads or circular inserts where the data temporarily violates the constraint during the transaction but is valid by the commit time.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-10-prod1',
        severity: 'warning',
        content: 'Never rely on ORM-level validation (like SQLAlchemy validators) for uniqueness. Always use DB constraints to prevent race conditions.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-10-rw1',
        scenario: 'Duplicate Payment Processing',
        problem: 'A webhook for successful payments occasionally fired twice within milliseconds. The app checked if the payment existed, found none, and processed it twice, granting double credits.',
        solution: 'Added a UNIQUE constraint on the transaction_id provided by the payment gateway. The second concurrent request failed with an IntegrityError, safely aborting.'
      }
    ],
    commonMistakes: [
      {
        id: '03-10-mistake1',
        title: 'Unnamed Constraints',
        description: 'Not naming constraints leads to auto-generated names like `ck__users__c2f5`, making Alembic migrations try to drop and recreate them differently across environments.',
        badCode: {
          id: '03-10-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `CheckConstraint('age > 18')`
        },
        goodCode: {
          id: '03-10-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `CheckConstraint('age > 18', name='chk_user_age_adult')`
        }
      }
    ]
  },
  'full-text-search': {
    id: '03-11',
    slug: 'full-text-search',
    chapterId: 3,
    order: 11,
    title: 'Full-Text Search with PostgreSQL',
    description: 'Build powerful search engines directly inside Postgres.',
    duration: 45,
    difficulty: 'advanced',
    technologies: [technologies.postgresql],
    prerequisites: ['03-04'],
    objectives: [
      'Create tsvector columns with GIN indexes',
      'Write tsquery search expressions',
      'Implement ranked search results',
      'Compare PostgreSQL FTS vs Elasticsearch'
    ],
    sections: [
      {
        id: '03-11-sec1',
        type: 'concept',
        title: 'Beyond the ILIKE Clause',
        content: `Using \`ILIKE '%search%'\` requires a full table scan and cannot leverage indexes efficiently. It also doesn't understand language, stemming, or relevance.\n\nPostgreSQL has a built-in Full-Text Search (FTS) engine. It parses text into lexical tokens (\`tsvector\`), removing stopwords and converting words to their root stems (e.g., "running" becomes "run"). You then query this vector using a \`tsquery\`, which supports boolean operators (AND, OR, NOT). When backed by a **GIN** index, FTS can search millions of rows in milliseconds.`
      },
      {
        id: '03-11-sec2',
        type: 'implementation',
        title: 'Configuring Search Vectors',
        content: `Instead of parsing text on the fly, you can create a generated \`tsvector\` column that automatically stays updated with the row's content, and index it.`,
        codeExample: {
          id: '03-11-code1',
          language: 'python',
          title: 'TSVector Column and GIN Index',
          files: {
            'app/models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, Integer, String, Text, Computed, Index\nfrom sqlalchemy.dialects.postgresql import TSVECTOR\n\nclass Article(Base):\n    __tablename__ = 'articles'\n    id = Column(Integer, primary_key=True)\n    title = Column(String)\n    body = Column(Text)\n    \n    # Generated column for search\n    search_vector = Column(\n        TSVECTOR,\n        Computed("to_tsvector('english', title || ' ' || body)", persisted=True)\n    )\n    \n    __table_args__ = (\n        Index('ix_article_search', 'search_vector', postgresql_using='gin'),\n    )`
            }
          }
        }
      },
      {
        id: '03-11-sec3',
        type: 'architecture',
        title: 'Ranking and Weighting',
        content: `Not all matches are equal. A match in the title is usually more relevant than a match in the body. PostgreSQL's \`ts_rank\` function calculates a relevance score, and \`setweight\` allows you to assign different weights (A, B, C, D) to different parts of your document.`
      }
    ],
    codeExamples: [
      {
        id: '03-11-example1',
        title: 'Executing Ranked Search',
        files: {
          'app/repositories.py': {
            language: 'python',
            code: `from sqlalchemy import func, text\n\nasync def search_articles(session, query: str):\n    # func.plainto_tsquery safely escapes user input into a tsquery\n    search_query = func.plainto_tsquery('english', query)\n    \n    stmt = (\n        select(Article)\n        .where(Article.search_vector.op('@@')(search_query))\n        .order_by(func.ts_rank(Article.search_vector, search_query).desc())\n        .limit(10)\n    )\n    result = await session.execute(stmt)\n    return result.scalars().all()`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-11-chal1',
        title: 'Weighted Search Query',
        description: 'Modify the generated search_vector column to give the `title` a weight of A and `body` a weight of B.',
        hint: 'Use the setweight() function in raw SQL.',
        solution: 'Use string concatenation and setweight in the Computed block.',
        solutionCode: {
          id: '03-11-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'model.py',
          code: `Computed("setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', body), 'B')")`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-11-int1',
        question: 'When would you choose Elasticsearch over PostgreSQL Full-Text Search?',
        answer: 'PostgreSQL FTS is fantastic for most applications and reduces infrastructure complexity. However, if you need highly advanced features like fuzzy matching (typo tolerance), complex synonym graphs, faceted search, or if your dataset outgrows a single database node, a dedicated search engine like Elasticsearch is better.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-11-prod1',
        severity: 'info',
        content: 'Always use plainto_tsquery or websearch_to_tsquery for user input. Using to_tsquery directly on user input will throw syntax errors if they type unescaped operators like & or |.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-11-rw1',
        scenario: 'The Infrastructure Consolidation',
        problem: 'A startup was paying $500/mo for a managed Elasticsearch cluster that synced via Kafka, just to power a simple blog search.',
        solution: 'Migrated the search logic to PostgreSQL FTS with GIN indexes. Deleted the ES cluster, Kafka pipelines, and reduced complexity with zero loss in perceived search quality.'
      }
    ],
    commonMistakes: [
      {
        id: '03-11-mistake1',
        title: 'Dynamic Vectors Without Indexes',
        description: 'Computing to_tsvector on the fly in the WHERE clause cannot use indexes and will result in a sequential scan.',
        badCode: {
          id: '03-11-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `select(Article).where(func.to_tsvector(Article.body).op('@@')(query))`
        },
        goodCode: {
          id: '03-11-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `select(Article).where(Article.search_vector.op('@@')(query))`
        }
      }
    ]
  },
  'json-jsonb-columns': {
    id: '03-12',
    slug: 'json-jsonb-columns',
    chapterId: 3,
    order: 12,
    title: 'JSON & JSONB Columns',
    description: 'Leverage NoSQL capabilities within a relational database.',
    duration: 40,
    difficulty: 'advanced',
    technologies: [technologies.postgresql, technologies.sqlalchemy],
    prerequisites: ['03-01'],
    objectives: [
      'Use JSONB for flexible schema data',
      'Query JSONB with operators and path expressions',
      'Index JSONB fields with GIN',
      'Avoid the JSONB performance traps'
    ],
    sections: [
      {
        id: '03-12-sec1',
        type: 'concept',
        title: 'Relational Meets Document',
        content: `PostgreSQL's **JSONB** (JSON Binary) type allows you to store arbitrary, unstructured JSON documents alongside strict relational data. Unlike the plain \`JSON\` type which stores text verbatim (including whitespace), \`JSONB\` parses and stores data in a binary format, allowing fast indexing and querying.\n\nJSONB is perfect for data with highly variable schemas: e-commerce product attributes (size, color, voltage), feature flags, or storing external API payloads. It gives you the flexibility of MongoDB without losing ACID compliance and relational integrity.`
      },
      {
        id: '03-12-sec2',
        type: 'implementation',
        title: 'Querying JSONB in SQLAlchemy',
        content: `SQLAlchemy fully supports Postgres JSON operators. You can query deeply nested paths, check for the existence of keys, or filter by values within the JSON document.`,
        codeExample: {
          id: '03-12-code1',
          language: 'python',
          title: 'JSONB Operations',
          files: {
            'app/repositories.py': {
              language: 'python',
              code: `from sqlalchemy.dialects.postgresql import JSONB\n\nclass Event(Base):\n    __tablename__ = 'events'\n    id = Column(Integer, primary_key=True)\n    payload = Column(JSONB)\n\nasync def get_failed_logins(session):\n    # Extract nested value: payload->'user'->>'status' == 'failed'\n    stmt = select(Event).where(\n        Event.payload['user']['status'].astext == 'failed'\n    )\n    \n    # Check if a key exists: payload ? 'error_code'\n    stmt2 = select(Event).where(\n        Event.payload.has_key('error_code')\n    )`
            }
          }
        }
      },
      {
        id: '03-12-sec3',
        type: 'architecture',
        title: 'Indexing JSONB',
        content: `Querying JSONB without an index requires scanning and unpacking every document. You can create a GIN index on the entire JSONB column (allowing generic fast searches), or use a B-Tree index on a specific extracted property if you query it often.`
      }
    ],
    codeExamples: [
      {
        id: '03-12-example1',
        title: 'JSONB Indexes',
        files: {
          'app/models.py': {
            language: 'python',
            code: `__table_args__ = (\n    # GIN index for broad JSON operations (contains, has_key)\n    Index('ix_events_payload', 'payload', postgresql_using='gin'),\n    \n    # B-Tree index on a specific extracted field for fast equality/sorting\n    Index('ix_events_user_id', text("(payload->>'user_id')")),\n)`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-12-chal1',
        title: 'The Contains Operator',
        description: 'Write a query that finds all events where the payload contains `{"tags": ["urgent"]}`.',
        hint: 'Use the contains() method provided by SQLAlchemy JSONB.',
        solution: 'The @> operator (contains) is highly optimized by GIN indexes.',
        solutionCode: {
          id: '03-12-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'query.py',
          code: `stmt = select(Event).where(Event.payload.contains({'tags': ['urgent']}))`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-12-int1',
        question: 'When should you NOT use a JSONB column?',
        answer: 'You should avoid JSONB when the schema is known, stable, and highly relational, or when you need to enforce Foreign Keys on the data inside the JSON. Updating a single deeply nested field in a massive JSONB document requires the database to rewrite the entire document, which can cause severe bloat.',
        difficulty: 'advanced'
      }
    ],
    productionNotes: [
      {
        id: '03-12-prod1',
        severity: 'critical',
        content: 'Frequent updates to large JSONB columns cause PostgreSQL "TOAST table bloat" because the entire JSON blob is rewritten on disk on every update. Keep JSONB payloads small and use them for read-heavy or insert-only workloads.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-12-rw1',
        scenario: 'The E-Commerce Attribute Anti-Pattern',
        problem: 'An app used the EAV (Entity-Attribute-Value) pattern with 3 tables to store variable product specs, leading to massive 10-table joins and terrible performance.',
        solution: 'Collapsed the variable attributes into a single JSONB column `specs` on the Product table, utilizing GIN indexing. Query speed improved by 100x and schema complexity plummeted.'
      }
    ],
    commonMistakes: [
      {
        id: '03-12-mistake1',
        title: 'Missing .astext in Comparisons',
        description: 'Using `->` instead of `->>` extracts the value as a JSON scalar, not a text string. Comparing a JSON scalar to a Python string will fail silently or behave unexpectedly.',
        badCode: {
          id: '03-12-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `Event.payload['status'] == 'active' # Compares JSON to string`
        },
        goodCode: {
          id: '03-12-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `Event.payload['status'].astext == 'active'`
        }
      }
    ]
  },
  'database-performance-profiling': {
    id: '03-13',
    slug: 'database-performance-profiling',
    chapterId: 3,
    order: 13,
    title: 'Database Performance Profiling',
    description: 'Identify bottlenecks with pg_stat_statements and query analysis.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql],
    prerequisites: ['03-04'],
    objectives: [
      'Enable pg_stat_statements for query tracking',
      'Use auto_explain for slow query logging',
      'Interpret EXPLAIN ANALYZE output',
      'Optimize query plans with statistics'
    ],
    sections: [
      {
        id: '03-13-sec1',
        type: 'concept',
        title: 'Visibility is Everything',
        content: `When your FastAPI application slows down, the database is often the culprit. Guessing which query is slow is a waste of time. PostgreSQL offers world-class observability extensions.\n\n**pg_stat_statements** is the most important extension. It tracks execution statistics of all SQL statements executed, aggregating the total time spent, rows returned, and number of calls. It allows you to find queries that might be fast individually but are called so frequently that they dominate database CPU time.`
      },
      {
        id: '03-13-sec2',
        type: 'implementation',
        title: 'Querying pg_stat_statements',
        content: `Once enabled in \`postgresql.conf\` (\`shared_preload_libraries = 'pg_stat_statements'\`), you can query the view to find your top offending queries.`,
        codeExample: {
          id: '03-13-code1',
          language: 'sql',
          title: 'Top 5 Slowest Queries',
          files: {
            'db/profiling.sql': {
              language: 'sql',
              code: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\n\nSELECT \n    (total_exec_time / 1000 / 60) as total_min,\n    mean_exec_time as avg_ms,\n    calls,\n    query\nFROM pg_stat_statements\nORDER BY total_exec_time DESC\nLIMIT 5;`
            }
          }
        }
      },
      {
        id: '03-13-sec3',
        type: 'architecture',
        title: 'auto_explain for Production Insights',
        content: `Running \`EXPLAIN ANALYZE\` manually is tricky when queries depend on dynamic parameters. The **auto_explain** module automatically logs execution plans of slow statements directly to the Postgres log, including the exact parameters used, allowing you to debug production queries asynchronously without impacting users.`
      }
    ],
    codeExamples: [
      {
        id: '03-13-example1',
        title: 'Configuring auto_explain',
        files: {
          'conf/postgresql.conf': {
            language: 'ini',
            code: `shared_preload_libraries = 'pg_stat_statements, auto_explain'\n\n# Log execution plans for queries taking longer than 1 second\nauto_explain.log_min_duration = '1s'\nauto_explain.log_analyze = on\nauto_explain.log_buffers = on`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-13-chal1',
        title: 'Identify High I/O Queries',
        description: 'Write a query against pg_stat_statements to find queries that read the most blocks from disk (shared_blks_read).',
        hint: 'Sort by shared_blks_read descending.',
        solution: 'High disk reads usually indicate missing indexes or inadequate memory allocation.',
        solutionCode: {
          id: '03-13-sol1',
          language: 'sql',
          title: 'Solution',
          filename: 'query.sql',
          code: `SELECT query, shared_blks_read, calls\nFROM pg_stat_statements\nORDER BY shared_blks_read DESC LIMIT 10;`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-13-int1',
        question: 'Why might a query run fast locally but result in a terrible execution plan in production?',
        answer: 'PostgreSQL relies on statistics (via the ANALYZE command) to decide the execution plan. If the production database statistics are outdated, or if the data distribution is wildly different, the planner might choose a nested loop instead of a hash join, or a sequential scan instead of an index scan.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-13-prod1',
        severity: 'critical',
        content: 'Be careful with auto_explain.log_analyze = on in very high-load environments, as it adds significant overhead to every query that breaches the duration threshold.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-13-rw1',
        scenario: 'The Hidden High-Frequency Query',
        problem: 'CPU utilization on the database was at 90%, but no single query took longer than 10ms.',
        solution: 'Used pg_stat_statements and sorted by `calls`. Found an N+1 query being executed 50,000 times a minute. Fixing the ORM logic dropped CPU to 15%.'
      }
    ],
    commonMistakes: [
      {
        id: '03-13-mistake1',
        title: 'Ignoring Cache Hit Ratios',
        description: 'Focusing only on execution time while ignoring disk reads.',
        badCode: {
          id: '03-13-bad1',
          language: 'sql',
          title: '❌ Wrong Way',
          code: `-- Looking only at time\nSELECT query FROM pg_stat_statements ORDER BY mean_exec_time DESC;`
        },
        goodCode: {
          id: '03-13-good1',
          language: 'sql',
          title: '✅ Correct Way',
          code: `-- Analyzing Cache Hit Ratio (Aim for > 99%)\nSELECT \n  sum(shared_blks_hit) / (sum(shared_blks_hit) + sum(shared_blks_read)) as cache_hit_ratio\nFROM pg_stat_statements;`
        }
      }
    ]
  },
  'read-replicas-scaling': {
    id: '03-14',
    slug: 'read-replicas-scaling',
    chapterId: 3,
    order: 14,
    title: 'Read Replicas & Database Scaling',
    description: 'Scale read-heavy applications with replication routing.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.postgresql],
    prerequisites: ['03-05'],
    objectives: [
      'Set up PostgreSQL streaming replication',
      'Route read queries to replicas',
      'Handle replication lag in application code',
      'Monitor replica lag in production'
    ],
    sections: [
      {
        id: '03-14-sec1',
        type: 'concept',
        title: 'Scaling Out Relational Databases',
        content: `Once a single Primary database node maxes out its CPU or IOPS, you must scale. While scaling up (bigger hardware) works initially, scaling out via **Read Replicas** is the standard for read-heavy applications.\n\nPostgreSQL uses Write-Ahead Log (WAL) streaming replication. The Primary node writes data changes to the WAL, which are asynchronously streamed and applied to Replica nodes. This allows you to offload all \`SELECT\` queries (like reporting, dashboards, or public listings) to the replicas, freeing up the Primary for \`INSERT/UPDATE/DELETE\` operations.`
      },
      {
        id: '03-14-sec2',
        type: 'implementation',
        title: 'Query Routing in FastAPI',
        content: `To utilize replicas, your application needs two database engines. You can create a dependency that determines whether a request needs write access or read-only access, yielding the appropriate session.`,
        codeExample: {
          id: '03-14-code1',
          language: 'python',
          title: 'Primary and Replica Engines',
          files: {
            'app/database.py': {
              language: 'python',
              code: `engine_primary = create_async_engine(PRIMARY_URL)\nengine_replica = create_async_engine(REPLICA_URL)\n\nSessionPrimary = async_sessionmaker(engine_primary)\nSessionReplica = async_sessionmaker(engine_replica)\n\nasync def get_db_write():\n    async with SessionPrimary() as session:\n        yield session\n        \nasync def get_db_read():\n    async with SessionReplica() as session:\n        yield session`
            },
            'app/api.py': {
              language: 'python',
              code: `@app.get("/users")\nasync def get_users(db = Depends(get_db_read)):\n    # Hits the replica\n    pass\n\n@app.post("/users")\nasync def create_user(db = Depends(get_db_write)):\n    # Hits the primary\n    pass`
            }
          }
        }
      },
      {
        id: '03-14-sec3',
        type: 'architecture',
        title: 'The Replication Lag Challenge',
        content: `Because replication is usually asynchronous, there is a delay (lag) between a write on the primary and the data appearing on the replica. If a user creates a post and immediately redirects to a page that reads from the replica, they might not see their post. Applications handle this by forcing read-after-write operations to use the Primary session for a short time (e.g., using a cookie or caching the recent write).`
      }
    ],
    codeExamples: [
      {
        id: '03-14-example1',
        title: 'Checking Replication Lag',
        files: {
          'db/lag.sql': {
            language: 'sql',
            code: `-- Run on the Primary node to see connected replicas and lag\nSELECT \n    client_addr, \n    state, \n    sent_lsn, \n    write_lsn, \n    flush_lsn, \n    replay_lsn, \n    pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes\nFROM pg_stat_replication;`
          }
        }
      }
    ],
    challenges: [
      {
        id: '03-14-chal1',
        title: 'Dynamic Routing Middleware',
        description: 'Design a middleware concept (no code needed, just logic) that automatically routes GET requests to replicas and POST/PUT/DELETE requests to the primary.',
        hint: 'Consider the HTTP method.',
        solution: 'Intercept the request in middleware, check request.method. If GET/OPTIONS, attach a replica session to request.state.db, else attach primary.',
        solutionCode: {
          id: '03-14-sol1',
          language: 'python',
          title: 'Solution',
          filename: 'middleware.py',
          code: `# Logic: if request.method in ["GET", "HEAD"]: use Replica`
        }
      }
    ],
    interviewQuestions: [
      {
        id: '03-14-int1',
        question: 'Why not use Synchronous Replication to fix replication lag?',
        answer: 'Synchronous replication guarantees the replica has the data before the primary commits. However, it blocks the primarys transaction until the network acknowledges the replica received it, vastly increasing latency and tying availability to the replica (if the replica goes down, the primary stops accepting writes).',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: '03-14-prod1',
        severity: 'critical',
        content: 'Long-running SELECT queries on a replica can conflict with WAL replay (e.g., if the primary drops a table you are querying). Postgres resolves this by cancelling the replica query. Tune max_standby_streaming_delay to balance this.'
      }
    ],
    realWorldScenarios: [
      {
        id: '03-14-rw1',
        scenario: 'The Refresh Button Spam',
        problem: 'Users updated their profiles, hit save, were redirected to their profile page, and saw old data. Thinking it failed, they re-submitted multiple times.',
        solution: 'Implemented "Read-Your-Writes" consistency. When a user writes data, a Redis key `user:{id}:wrote` is set for 2 seconds. The DB router checks this key; if true, it routes all reads for that user to the Primary.'
      }
    ],
    commonMistakes: [
      {
        id: '03-14-mistake1',
        title: 'Executing Writes on Replicas',
        description: 'Failing to isolate sessions properly can result in the app trying to execute UPDATEs on the read-only replica connection, crashing the request.',
        badCode: {
          id: '03-14-bad1',
          language: 'python',
          title: '❌ Wrong Way',
          code: `session = SessionReplica()\nawait session.execute(update(User))`
        },
        goodCode: {
          id: '03-14-good1',
          language: 'python',
          title: '✅ Correct Way',
          code: `session = SessionPrimary()\nawait session.execute(update(User))`
        }
      }
    ]
  }
};
