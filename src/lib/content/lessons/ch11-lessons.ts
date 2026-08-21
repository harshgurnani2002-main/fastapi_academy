import { Lesson } from '../types';
import { technologies } from '../technologies';

export const ch11Lessons: Record<string, Lesson> = {
  'events-vs-commands': {
    id: '11-01',
    slug: 'events-vs-commands',
    chapterId: 11,
    order: 1,
    title: 'Events vs Commands: Design Philosophy',
    description: 'Distinguish between events and commands to build loosely coupled systems.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.python],
    prerequisites: [],
    objectives: [
      'Distinguish events from commands semantically',
      'Design event schemas for long-term compatibility',
      'Choose event vs command for different scenarios',
      'Avoid the common mistake of commanding through events'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Understanding the Difference',
        content: `In distributed systems, distinguishing between **Events** and **Commands** is crucial for architectural health. 
        
A **Command** is an intent to change state. It is directed at a specific target, expects a specific outcome, and often requires a response. For instance, \`CreateUser\` or \`ProcessPayment\`. The sender cares about *who* processes it and *how* it turns out.

An **Event**, on the other hand, is a statement of fact that something *has happened*. It is broadcasted to anyone who might care, without expecting a specific response. For example, \`UserCreated\` or \`PaymentProcessed\`. The sender does not care who consumes the event or what they do with it. This creates loose coupling.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Modeling Events and Commands',
        content: `Let's look at how we might model these using Pydantic in a FastAPI application. Notice how commands often contain the exact data needed to perform an action, while events often contain the resulting state or just the identifiers of what changed.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Schemas for Commands and Events',
          filename: 'schemas.py',
          code: `from datetime import datetime, timezone
from pydantic import BaseModel, Field
from uuid import UUID, uuid4

# --- Commands ---
# Commands are imperative. They tell the system to do something.
class CreateOrderCommand(BaseModel):
    customer_id: UUID
    item_ids: list[UUID]
    shipping_address: str

class ChargeCreditCardCommand(BaseModel):
    order_id: UUID
    amount: float
    token: str

# --- Events ---
# Events are facts in the past tense. They describe what happened.
class EventBase(BaseModel):
    event_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class OrderCreatedEvent(EventBase):
    order_id: UUID
    customer_id: UUID
    total_amount: float
    
class PaymentSucceededEvent(EventBase):
    order_id: UUID
    transaction_id: str`
        }
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'The "Commanding via Events" Anti-Pattern',
        content: `A very common mistake when moving to event-driven architecture is to use events as disguised commands. For example, an \`OrderService\` publishes a \`SendWelcomeEmailEvent\`. 

Why is this bad? Because the \`OrderService\` is now coupled to the email sending process. It knows that an email needs to be sent. If the business rule changes to "send an email and an SMS", the \`OrderService\` has to be updated.

Instead, the \`OrderService\` should publish an \`OrderCreatedEvent\`. The \`NotificationService\` listens to \`OrderCreatedEvent\` and decides on its own to send an email. The \`OrderService\` remains blissfully unaware of the side effects of its actions.`
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Refactor to True Events',
        description: 'You have a user service that emits `SendWelcomeEmailEvent` and `InitializeUserWalletEvent` after a user registers. Refactor this to use a single, true event.',
        hint: 'What is the actual fact that occurred in the user service? The event should represent that fact, not the subsequent actions.',
        solution: 'The user service should only emit `UserRegisteredEvent`. The email service and wallet service should independently listen to this event.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'True Event Modeling',
          filename: 'events.py',
          code: `from pydantic import BaseModel
from uuid import UUID

class UserRegisteredEvent(BaseModel):
    user_id: UUID
    email: str
    
# Consumer in EmailService:
# @listen("UserRegisteredEvent")
# async def handle_user_registered_email(event: UserRegisteredEvent):
#     send_email(event.email)

# Consumer in WalletService:
# @listen("UserRegisteredEvent")
# async def handle_user_registered_wallet(event: UserRegisteredEvent):
#     create_wallet(event.user_id)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the semantic difference between a command and an event?',
        answer: 'A command is an intent to change state (imperative, expecting a result, directed at a specific handler). An event is a statement of fact that something happened (past tense, broadcasted, sender doesn\'t know or care about receivers).',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'Why is it a bad practice to have an event named "SendEmailEvent"?',
        answer: 'It creates tight coupling. The sender is dictating the behavior of other services, meaning it has knowledge of their responsibilities. It should instead emit a fact like "UserCreatedEvent", letting the email service decide whether to send an email.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'When designing events, include only the data necessary to describe the event. If consumers need more data, they can query the source system using the IDs provided in the event.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Monolithic Microservices',
        problem: 'A team built microservices but communicated entirely via direct HTTP commands. When one service went down, cascading failures took down the entire system.',
        solution: 'Replaced synchronous commands with asynchronous events. Services emitted state changes, and dependent services updated their own read models, allowing them to function even when upstream services were down.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Commanding through Events',
        description: 'Using events to tell other services what to do, coupling the publisher to the downstream domain logic.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Disguised Command',
          code: `class CreateInvoiceEvent(BaseModel):\n    order_id: str\n    amount: float`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'True Event',
          code: `class OrderFulfilledEvent(BaseModel):\n    order_id: str\n    total: float`
        }
      }
    ],
    codeExamples: [],
  },
  'message-broker-comparison': {
    id: '11-02',
    slug: 'message-broker-comparison',
    chapterId: 11,
    order: 2,
    title: 'Message Broker Comparison: Redis vs RabbitMQ vs Kafka',
    description: 'Understand the trade-offs between different message brokers to choose the right one for your architecture.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.rabbitmq],
    prerequisites: ['11-01'],
    objectives: [
      'Compare persistence, ordering, and throughput',
      'Choose Redis Streams for low-complexity use cases',
      'Choose Kafka for high-throughput event sourcing',
      'Evaluate operational complexity trade-offs'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Broker Landscape',
        content: `Choosing a message broker is a critical architectural decision. The "big three" for asynchronous messaging are Redis (Pub/Sub or Streams), RabbitMQ, and Apache Kafka.

**Redis (Streams)** is lightweight, fast, and often already in your stack for caching. It provides decent persistence and consumer groups but lacks advanced routing.
**RabbitMQ** is a traditional message queue (AMQP). It excels at complex routing, individual message acknowledgment, and "smart broker, dumb consumer" models. It's great for task queues (like Celery).
**Kafka** is a distributed append-only log. It excels at extreme throughput, event replay (event sourcing), and "dumb broker, smart consumer" models. It stores events permanently (or based on retention policies) rather than deleting them when consumed.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Key Differences',
        content: `1. **Message Retention**: RabbitMQ typically deletes messages once acknowledged. Kafka retains them until a time/size limit is reached, allowing new consumers to read past events. Redis Streams act somewhat like Kafka but with fewer guarantees.
2. **Routing**: RabbitMQ uses exchanges and bindings for complex routing (e.g., topic routing based on wildcards). Kafka relies entirely on topics; routing is usually done by the consumer.
3. **Ordering**: Kafka guarantees strict ordering *within a partition*. RabbitMQ guarantees ordering within a single queue.
4. **Scaling**: Kafka scales horizontally by adding partitions. RabbitMQ scales by adding more queues and consumers.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Connecting to Brokers in FastAPI',
        content: `While you can use raw clients (\`aioredis\`, \`aio_pika\`, \`aiokafka\`), frameworks like FastStream or Broadq provide higher-level abstractions.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Using FastStream for Broker Abstraction',
          filename: 'main.py',
          code: `from fastapi import FastAPI
from pydantic import BaseModel
# pip install faststream[rabbit]
from faststream.rabbit.fastapi import RabbitRouter

router = RabbitRouter("amqp://guest:guest@localhost:5672/")
app = FastAPI()

class OrderEvent(BaseModel):
    order_id: int
    status: str

# Consuming from RabbitMQ
@router.subscriber("orders_queue")
async def process_order(event: OrderEvent):
    print(f"Processing order {event.order_id}")
    return {"status": "processed"}

# Publishing
@app.post("/orders/")
async def create_order(order: OrderEvent):
    # Do database stuff...
    await router.broker.publish(order, queue="orders_queue")
    return {"message": "Order created"}

app.include_router(router)`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Select the Right Broker',
        description: 'You are building a real-time analytics system that ingests 50,000 events per second. Multiple different downstream systems need to process these events at their own pace, and they occasionally need to re-read yesterday\'s data to fix bugs.',
        hint: 'Look for high throughput, multiple independent consumers, and message retention/replay capabilities.',
        solution: 'Kafka. Kafka excels at high throughput and retains messages on disk, allowing consumers to rewind their offsets and replay past events.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'No Code Required',
          filename: 'concept.txt',
          code: `Apache Kafka`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'When would you choose RabbitMQ over Kafka?',
        answer: 'I would choose RabbitMQ for complex routing requirements, priority queues, delaying messages, or when I need strict individual message acknowledgments (rather than offset tracking). It is better for traditional task queues.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'How does Kafka guarantee message ordering?',
        answer: 'Kafka guarantees ordering only within a specific partition of a topic. By routing related messages (e.g., all events for a specific user ID) to the same partition using a partition key, strict ordering is maintained for that entity.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Kafka is operationally complex (often requiring ZooKeeper/KRaft). Do not choose Kafka for a simple project just for the resume value; operational overhead is high.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Redis Memory Leak',
        problem: 'A team used Redis Pub/Sub for critical events. During a spike, consumers crashed. Since Pub/Sub is "fire and forget", all events generated during the downtime were permanently lost.',
        solution: 'Migrated from Redis Pub/Sub to Redis Streams, which persists messages and uses consumer groups to track which messages have been acknowledged.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Assuming Global Ordering',
        description: 'Assuming a message broker can provide strict global ordering across millions of messages while also scaling horizontally.',
        badCode: {
          id: 'bc-1',
          language: 'text',
          title: 'Flawed Assumption',
          code: `Expecting message 1, 2, 3 to be processed exactly in that order globally across multiple consumer instances.`
        },
        goodCode: {
          id: 'gc-1',
          language: 'text',
          title: 'Correct Design',
          code: `Designing consumers to handle out-of-order events or ensuring causal ordering per entity (e.g., by partition key).`
        }
      }
    ],
    codeExamples: [],
  },
  'outbox-pattern': {
    id: '11-03',
    slug: 'outbox-pattern',
    chapterId: 11,
    order: 3,
    title: 'The Transactional Outbox Pattern',
    description: 'Guarantee event delivery when writing to a database and a message broker simultaneously.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['11-01'],
    objectives: [
      'Implement outbox table in PostgreSQL',
      'Publish events atomically within DB transactions',
      'Build a reliable outbox relay worker',
      'Handle duplicate event publishing correctly'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Dual Write Problem',
        content: `A common scenario in microservices: you need to save data to your database and publish an event to a broker (e.g., save \`User\` and publish \`UserCreated\`). 

If you save the DB first, then try to publish, the broker might be down, leaving your system inconsistent (state changed, no event). If you publish first, the DB commit might fail, leaving you with an event for a state that doesn't exist. You cannot wrap a DB transaction and a message broker publish in a single distributed transaction easily.

This is the **Dual Write Problem**. The **Transactional Outbox Pattern** solves this.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'How the Outbox Pattern Works',
        content: `Instead of publishing directly to the broker, you write the event to an \`outbox_events\` table in the *same database* and the *same transaction* as your domain data update. 

Since it's a single RDBMS transaction, it's atomic: either the domain data and the outbox event both save, or neither do.

A separate asynchronous process (the Relay or Publisher) constantly polls (or listens to DB WAL logs via Change Data Capture - CDC) the \`outbox_events\` table. It reads unpublished events, sends them to the broker, and marks them as processed in the DB. This guarantees *at-least-once* delivery.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing the Outbox with SQLAlchemy',
        content: `Here is a complete, multi-file example showing the DB models, the FastAPI service, and a simple background worker.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Outbox Implementation',
          files: {
            'models.py': {
              language: 'python',
              code: `from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    
class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    id = Column(Integer, primary_key=True)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)`
            },
            'service.py': {
              language: 'python',
              code: `from sqlalchemy.orm import Session
from .models import User, OutboxEvent

def create_user(db: Session, email: str):
    # Both inserts happen in the same session/transaction
    new_user = User(email=email)
    db.add(new_user)
    db.flush() # get user ID
    
    event_payload = {"user_id": new_user.id, "email": email}
    outbox_event = OutboxEvent(
        event_type="USER_CREATED",
        payload=event_payload
    )
    db.add(outbox_event)
    db.commit() # Atomic commit!
    return new_user`
            },
            'worker.py': {
              language: 'python',
              code: `import asyncio
from sqlalchemy.orm import Session
# pseudo-broker
from broker import publish_message 
from .models import OutboxEvent

async def outbox_relay(db: Session):
    while True:
        # Find unprocessed events
        events = db.query(OutboxEvent).filter_by(processed=False).limit(100).all()
        for event in events:
            try:
                # 1. Publish to broker
                await publish_message(event.event_type, event.payload)
                # 2. Mark processed
                event.processed = True
                db.commit()
            except Exception as e:
                # If broker fails, we don't commit the processed state
                # It will be retried on the next loop
                db.rollback()
                print(f"Failed to publish event {event.id}: {e}")
        
        await asyncio.sleep(2) # Polling interval`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Fix the At-Least-Once Bug',
        description: 'In our worker loop, if `publish_message` succeeds but the database crashes *before* `db.commit()`, what happens? How does this affect downstream systems?',
        hint: 'Think about what the worker will do when the database recovers.',
        solution: 'When the worker restarts, the event is still `processed=False` in the DB. The worker will publish the event to the broker *again*. This results in duplicate messages (at-least-once delivery). Downstream systems MUST be idempotent to handle this.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Understanding At-Least-Once',
          filename: 'concept.txt',
          code: `No code fix in the outbox worker. The fix must be in the consumer (Idempotency).`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the "Dual Write Problem" and how do you solve it?',
        answer: 'The dual write problem occurs when a system needs to update a database and publish a message to a broker simultaneously. If one fails, the system becomes inconsistent. It is solved using the Transactional Outbox pattern, writing the event to the same DB in the same transaction, and using a background relay to publish it later.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'What is Debezium and how does it relate to the Outbox pattern?',
        answer: 'Debezium is a Change Data Capture (CDC) tool. Instead of writing a custom polling script to read the outbox table (which adds DB load), Debezium tails the database transaction logs (WAL in Postgres) and automatically streams outbox inserts directly to Kafka with extreme reliability and low latency.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Polling the outbox table with `SELECT ... WHERE processed=False` can cause heavy table bloat and slow down over time. Ensure you frequently DELETE processed events rather than just flagging them, or use table partitioning.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Lost Payments',
        problem: 'A payment service saved the payment to the DB, then called `redis.publish`. During a network blip, the publish failed. The DB showed the user paid, but the fulfillment service never received the event to ship the product.',
        solution: 'Implemented the Transactional Outbox pattern. Payments and outbox events were committed atomically. A worker ensured the events eventually reached the broker, achieving 100% reliable event delivery.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Publishing before Commit',
        description: 'Publishing an event inside an active DB transaction, but before the commit. If the commit fails, the event is already out in the wild, describing a state that was rolled back.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Publishing before Commit',
          code: `user = User(name="Alice")\ndb.add(user)\n# BAD: Publishing before commit\npublish("UserCreated", user.id)\ndb.commit() # What if this fails?`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Using Outbox',
          code: `user = User(name="Alice")\ndb.add(user)\noutbox_event = OutboxEvent(payload={"id": user.id})\ndb.add(outbox_event)\ndb.commit() # Atomic!`
        }
      }
    ],
    codeExamples: [],
  },
  'idempotent-consumers': {
    id: '11-04',
    slug: 'idempotent-consumers',
    chapterId: 11,
    order: 4,
    title: 'Idempotent Event Consumers',
    description: 'Design robust consumers that can safely handle duplicate messages from at-least-once delivery systems.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.postgresql],
    prerequisites: ['11-03'],
    objectives: [
      'Track processed event IDs in a database',
      'Use deduplication windows for performance',
      'Handle at-least-once delivery correctly',
      'Test idempotency with duplicate event injection'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Necessity of Idempotency',
        content: `Because distributed systems rely on networks, message brokers can only guarantee **at-least-once delivery**. If a consumer processes a message but crashes before sending the acknowledgment back to the broker, the broker will deliver that same message again.

Therefore, consumers must be **idempotent**. An operation is idempotent if executing it multiple times yields the same result as executing it once. If a "ChargeCard" event is processed twice, the customer should only be charged once.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Deduplication Strategies',
        content: `1. **Natural Idempotency**: The operation is inherently safe. (e.g., \`UPDATE user SET status = 'active'\`). Running this 10 times is fine.
2. **Database Constraints**: Using unique constraints in the DB (e.g., unique index on \`transaction_id\`). The second attempt raises a unique violation, which the consumer catches and safely ignores.
3. **Idempotency Keys / Inbox Pattern**: The consumer records every processed \`event_id\` in an "inbox" table. Before processing, it checks if the \`event_id\` exists. This check and the business logic must happen in the same DB transaction.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing the Inbox Pattern',
        content: `The Inbox pattern is the exact mirror of the Outbox pattern. We store incoming event IDs in the database within the same transaction as the business data change.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Idempotent Consumer with SQLAlchemy',
          filename: 'consumer.py',
          code: `from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .models import InboxEvent, UserWallet # Assuming these exist

class DuplicateEventError(Exception): pass

def process_wallet_funding(db: Session, event_id: str, user_id: int, amount: float):
    # 1. Check/Insert Inbox Event
    # We use DB unique constraints on event_id in the inbox table
    inbox_record = InboxEvent(event_id=event_id)
    db.add(inbox_record)
    
    try:
        # db.flush() attempts to write the inbox record.
        # If event_id already exists, it raises IntegrityError.
        db.flush() 
    except IntegrityError:
        db.rollback()
        print(f"Event {event_id} already processed. Skipping.")
        return # Safely acknowledge message without doing work
        
    # 2. Perform Business Logic
    wallet = db.query(UserWallet).filter_by(user_id=user_id).first()
    wallet.balance += amount
    
    # 3. Commit both the inbox record and the balance update atomically
    db.commit()
    print(f"Successfully processed {event_id}")`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Redis Deduplication Window',
        description: 'Checking the PostgreSQL database for every event can be slow under high load. Implement a fast deduplication check using Redis that caches processed event IDs for 24 hours.',
        hint: 'Use Redis SETNX (Set if Not eXists).',
        solution: 'Use Redis as a fast filter before hitting the DB. If Redis says we processed it, skip it. If Redis says we didn\'t, process it and set the key.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Redis Deduplication',
          filename: 'redis_dedup.py',
          code: `import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def is_duplicate(event_id: str, ttl_seconds: int = 86400) -> bool:
    # setnx returns 1 if key was set, 0 if it already existed
    is_new = redis_client.setnx(f"processed:{event_id}", "1")
    if is_new:
        # Set expiry so Redis doesn't run out of memory
        redis_client.expire(f"processed:{event_id}", ttl_seconds)
        return False # Not a duplicate
    return True # It is a duplicate`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Why do message brokers provide "at-least-once" delivery instead of "exactly-once"?',
        answer: '"Exactly-once" delivery over a network is practically impossible to guarantee due to the Two Generals Problem. If the network drops the acknowledgment packet, the broker doesn\'t know if the consumer processed the message or not, so it must retry, resulting in duplicates.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'How does the Inbox pattern handle database crashes?',
        answer: 'By storing the processed event ID in the same database transaction as the business data change. If the DB crashes before commit, neither the event ID nor the business change is saved. The broker will resend the message, and the system processes it correctly on the retry.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never use API calls to external third parties (like Stripe) inside an Inbox/DB transaction unless the third party API also supports idempotency keys. If the DB commit fails after calling Stripe, Stripe will still process the charge, but you will rollback and try again, double-charging the user.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Double Refund',
        problem: 'A consumer processed "RefundRequested" events by calling a payment gateway, then acknowledging the broker. A slow network caused broker timeouts; the broker re-sent the events. The consumer processed them again, refunding customers twice.',
        solution: 'Implemented idempotency keys. The consumer passed the `event_id` to the payment gateway as the idempotency key. The gateway recognized the duplicate key and ignored the second request.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Checking and Updating non-atomically',
        description: 'Checking if an event exists, doing work, then marking it processed in separate transactions. A race condition can cause duplicates.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Race Condition',
          code: `if has_processed(event.id): return\ndo_expensive_work()\nmark_processed(event.id) # What if crash before this?`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Atomic Inbox',
          code: `with db.begin():\n    db.add(Inbox(id=event.id)) # unique constraint handles duplicates\n    do_work(db)`
        }
      }
    ],
    codeExamples: [],
  },
  'eventual-consistency': {
    id: '11-05',
    slug: 'eventual-consistency',
    chapterId: 11,
    order: 5,
    title: 'Eventual Consistency: Designing for It',
    description: 'Master the user experience and architectural patterns needed when systems don\'t update immediately.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.redis],
    prerequisites: ['11-01'],
    objectives: [
      'Explain eventual consistency to stakeholders',
      'Design UI patterns that handle eventual consistency',
      'Use read-your-own-writes patterns',
      'Monitor consistency lag in production'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Embracing Eventual Consistency',
        content: `In monolithic systems using a single relational DB, ACID transactions provide immediate consistency. If you update a record and immediately read it, you see the update.

In event-driven microservices, data updates are propagated asynchronously. Service A updates its DB and fires an event. Service B (a read model) receives the event milliseconds or seconds later. For a brief window, Service A and Service B disagree on the state of the world. This is **Eventual Consistency**.

You cannot "fix" eventual consistency without introducing tight coupling and synchronous calls (ruining your microservice architecture). Instead, you must design your APIs and User Interfaces to accommodate it.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'UX and API Strategies',
        content: `How do we handle a user submitting a form, and the subsequent page load showing old data because the read model hasn't updated yet?
        
1. **Optimistic UI**: The frontend assumes the write succeeds and updates the UI locally without waiting for the backend read model.
2. **Polling/WebSockets**: The frontend polls a status endpoint or listens via WebSockets until the backend signals the processing is complete.
3. **Read-Your-Own-Writes (RYOW)**: The API returns the newly created data or an ETags/Version token. The frontend includes this token on read requests, and the backend delays the response until the read model catches up to that version.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing Polling with a Status Endpoint',
        content: `A very common pattern is the \`202 Accepted\` response. The API accepts the command, assigns a job ID, and gives the client a way to check the status.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: '202 Accepted Pattern',
          filename: 'main.py',
          code: `from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
import uuid

app = FastAPI()
job_store = {} # Fake Redis

@app.post("/reports/")
async def generate_report(background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    job_store[job_id] = {"status": "processing", "url": None}
    
    # Send event to broker/worker (simulated here)
    background_tasks.add_task(process_report, job_id)
    
    # Return 202 Accepted immediately with location to check status
    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "status_url": f"/reports/status/{job_id}"}
    )

@app.get("/reports/status/{job_id}")
async def get_status(job_id: str):
    job = job_store.get(job_id)
    if not job:
        return {"status": "not_found"}
    if job["status"] == "completed":
        # 303 See Other could also be used to redirect to the resource
        return {"status": "completed", "download_url": job["url"]}
    return {"status": "processing"}

async def process_report(job_id: str):
    import asyncio
    await asyncio.sleep(5) # Simulate long work
    job_store[job_id] = {"status": "completed", "url": f"/files/{job_id}.pdf"}`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Explain it to the Product Manager',
        description: 'Your Product Manager complains: "When a user changes their avatar, their old avatar still shows up in the header for about 2 seconds. This looks like a bug. Fix it so it updates instantly everywhere." How do you respond?',
        hint: 'Don\'t talk about microservices or CAP theorem immediately. Focus on the user experience solution.',
        solution: 'Explain that the system processes updates securely in the background for scale. Propose an Optimistic UI solution: "We can fix this in the frontend. When the user uploads the image, the frontend can immediately display that new image locally while the backend processes it. This gives the instant feel you want without slowing down the servers."',
        solutionCode: {
          id: 'sol-1',
          language: 'text',
          title: 'Communication',
          filename: 'response.txt',
          code: `Focus on Optimistic UI as the solution to hide the backend eventual consistency from the user.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is Read-Your-Own-Writes consistency?',
        answer: 'It is a consistency model where a system guarantees that once a client updates data, that same client will always see the updated data in subsequent reads, even if other clients might still see stale data due to eventual consistency.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'How do you monitor consistency lag?',
        answer: 'By attaching timestamps to events when they are generated. Consumers record the current time when they process the event, subtract the generation timestamp, and emit this metric (e.g., to Prometheus). This measures the "lag" pipeline.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'When relying on eventual consistency, ensure you have robust monitoring. "Eventual" can mean 10ms, but during an outage, it can mean 10 hours. Set alerts when lag exceeds business SLAs.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Frustrated Clicker',
        problem: 'A user clicked "Submit Order". The UI refreshed, read from a delayed read-replica, and showed an empty cart and no order history. The panicked user clicked "Submit" three more times, creating four orders.',
        solution: 'Implemented the PRG (Post/Redirect/Get) pattern but updated the frontend to optimistic UI. The cart cleared locally, and a loading spinner showed on the order history until a WebSocket event confirmed the order was fully processed.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Fighting Eventual Consistency',
        description: 'Trying to force synchronous behavior by making microservices wait for HTTP responses from each other, resulting in tight coupling and cascading timeouts.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Synchronous Wait',
          code: `def create_user():\n    save_db()\n    # BAD: Waiting on another service synchronously\n    httpx.post("http://search-service/sync")`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Asynchronous Event',
          code: `def create_user():\n    save_db()\n    publish("UserCreated")\n    return 202`
        }
      }
    ],
    codeExamples: [],
  },
  'event-ordering': {
    id: '11-06',
    slug: 'event-ordering',
    chapterId: 11,
    order: 6,
    title: 'Event Ordering & Causal Consistency',
    description: 'Ensure systems behave correctly when network delays cause events to arrive out of sequence.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.postgresql],
    prerequisites: ['11-01'],
    objectives: [
      'Use sequence numbers for per-aggregate ordering',
      'Handle out-of-order events with buffering',
      'Implement causal ordering with vector clocks',
      'Design systems that tolerate out-of-order events'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Out-of-Order Problem',
        content: `In distributed systems, you cannot guarantee that events arrive in the exact temporal order they were generated. 

Imagine a user updates their address to "New York", and then immediately to "London". Two events are fired:
1. \`AddressUpdated(NY)\`
2. \`AddressUpdated(London)\`

Due to network routing, retries, or partitioned queues, a downstream service might receive \`AddressUpdated(London)\` first, and \`AddressUpdated(NY)\` second. If the service blindly applies updates, the user's final address will incorrectly be New York. This violates causal consistency.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Solving Out-of-Order Delivery',
        content: `1. **Broker Guarantees**: Use tools like Kafka that guarantee ordering per partition key (e.g., routing all events for \`user_123\` to the same partition). This solves 90% of ordering issues.
2. **Sequence Numbers / Timestamps**: The publisher includes an incrementing \`version\` or high-precision timestamp in every event. Consumers check this before applying.
3. **Commutative Operations**: Design events so order doesn't matter (e.g., adding delta values instead of setting absolute values). \`BalanceAdded(5)\` and \`BalanceAdded(10)\` can be processed in any order.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing Sequence Checking',
        content: `When a consumer receives an event, it checks the local database for the highest version seen for that entity. If the incoming event is older, it is discarded. If it's a future event, it might be buffered.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Version Checking Consumer',
          filename: 'consumer.py',
          code: `from sqlalchemy.orm import Session
from .models import UserReadModel

def process_address_update(db: Session, user_id: int, new_address: str, event_version: int):
    user = db.query(UserReadModel).filter_by(id=user_id).first()
    
    if not user:
        # Handle creation or buffer event if user doesn't exist yet
        pass
        
    # Check for stale event
    if event_version <= user.last_processed_version:
        print(f"Ignoring stale event. Current version {user.last_processed_version}, Event version {event_version}")
        return
        
    # Check for missing events (gap in sequence)
    if event_version > user.last_processed_version + 1:
        print(f"Gap detected! Expected {user.last_processed_version + 1}, got {event_version}.")
        # Strategy 1: Error out, let broker retry later (hoping missing event arrives)
        # Strategy 2: Store in a buffer table to process later
        raise ValueError("Out of order event")
        
    # Apply update and increment version
    user.address = new_address
    user.last_processed_version = event_version
    db.commit()`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Design Commutative Events',
        description: 'You have a billing system. Events are currently: `BalanceUpdated(new_balance=100)`, `BalanceUpdated(new_balance=50)`. If these arrive out of order, the balance is wrong. Redesign the events so order does not matter.',
        hint: 'Instead of sending absolute state, send the change (delta).',
        solution: 'Change events to `AccountCredited(amount=100)` and `AccountDebited(amount=50)`. Addition and subtraction are commutative (A - B = -B + A). Regardless of arrival order, the final balance is correct.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Delta Events',
          filename: 'events.py',
          code: `class AccountDebitedEvent(BaseModel):\n    account_id: str\n    amount: float\n    transaction_id: str # For idempotency!`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'Why are timestamps usually insufficient for strict event ordering?',
        answer: 'Clock skew. Different servers in a distributed system have slightly different clocks (even with NTP). Server A might generate an event after Server B, but Server A\'s clock is behind, making its event look older. Logical sequence numbers or vector clocks are safer.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'What is a Vector Clock?',
        answer: 'A logical clock system that tracks the partial ordering of events across multiple nodes. It maintains an array (vector) of counters, one for each node, allowing systems to definitively determine if event A caused event B, or if they were concurrent.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'When handling out-of-order events by dropping stale messages, be careful. If an entity has multiple fields (address, phone), an old address event might wipe out a new phone event if they carry the full state. Use partial update events or ensure versions are tracked per field.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Resurrected User',
        problem: 'A user was created, then immediately deleted. The `UserDeleted` event processed fast. The `UserCreated` event got stuck in a queue and processed 5 minutes later. The system read the `UserCreated` event and recreated the deleted user.',
        solution: 'Implemented Tombstones and sequence numbers. When deleted, a tombstone record with version 2 was left in the DB. When the `UserCreated` (version 1) arrived, the DB saw version 1 < 2 and discarded it.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Relying purely on created_at',
        description: 'Using `created_at` timestamps to determine event order across different microservices without accounting for clock drift.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Timestamp sorting',
          code: `if incoming_event.created_at < current_record.updated_at:\n    ignore()`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Version sorting',
          code: `if incoming_event.aggregate_version <= current_record.version:\n    ignore()`
        }
      }
    ],
    codeExamples: [],
  },
  'saga-pattern': {
    id: '11-07',
    slug: 'saga-pattern',
    chapterId: 11,
    order: 7,
    title: 'Saga Pattern for Distributed Transactions',
    description: 'Manage long-running business processes across multiple microservices with rollbacks.',
    duration: 55,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql, technologies.celery],
    prerequisites: ['11-01', '11-03'],
    objectives: [
      'Design choreography-based Saga',
      'Implement orchestration-based Saga',
      'Write compensating transactions for rollback',
      'Handle partial failures in long-running Sagas'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Distributed Transactions',
        content: `In a monolith, a multi-step process (Create Order -> Reserve Inventory -> Charge Card) happens in one ACID database transaction. If charging the card fails, the inventory reservation rolls back automatically.

In microservices, these live in different databases. You cannot use ACID transactions across them easily (Two-Phase Commit is slow and locks resources). 

The **Saga Pattern** solves this. A Saga is a sequence of local transactions. Each service performs its local transaction and publishes an event. If a step fails, the Saga executes **Compensating Transactions**—requests that undo the work of the previous steps.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Choreography vs Orchestration',
        content: `There are two ways to coordinate a Saga:

**Choreography**: No central brain. Services listen to each other's events. 
(OrderCreated -> InventoryListens -> InventoryReserved -> PaymentListens...)
*Pros:* Simple for small workflows, highly decoupled. 
*Cons:* Hard to track the overall status, complex to debug, cyclical dependencies.

**Orchestration**: A central Coordinator (or Orchestrator) service tells everyone what to do via commands and waits for replies.
(Orchestrator sends ReserveInventory command, waits for success, sends ChargeCard command...)
*Pros:* Centralized status tracking, easy to implement complex rollback logic. 
*Cons:* The orchestrator can become a god-service if too much domain logic leaks into it.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Orchestration Implementation Concept',
        content: `An orchestrator maintains a State Machine in a database to track the Saga's progress.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Saga Orchestrator State Machine',
          filename: 'orchestrator.py',
          code: `from enum import Enum

class SagaState(Enum):
    STARTED = "started"
    INVENTORY_RESERVED = "inventory_reserved"
    PAYMENT_PROCESSED = "payment_processed"
    COMPLETED = "completed"
    # Failure states
    PAYMENT_FAILED = "payment_failed"
    COMPENSATING_INVENTORY = "compensating_inventory"
    ROLLED_BACK = "rolled_back"

class OrderSagaOrchestrator:
    def __init__(self, db, message_broker):
        self.db = db
        self.broker = message_broker
        
    async def handle_order_created(self, order_id):
        # 1. Update state
        self.save_state(order_id, SagaState.STARTED)
        # 2. Send command to Inventory
        await self.broker.publish("inventory.reserve", {"order_id": order_id})
        
    async def handle_inventory_reserved(self, order_id):
        self.save_state(order_id, SagaState.INVENTORY_RESERVED)
        # Next step: Charge payment
        await self.broker.publish("payment.charge", {"order_id": order_id})
        
    async def handle_payment_failed(self, order_id, reason):
        self.save_state(order_id, SagaState.PAYMENT_FAILED)
        # Failure! Initiate Compensation. 
        # We need to undo the inventory reservation.
        self.save_state(order_id, SagaState.COMPENSATING_INVENTORY)
        await self.broker.publish("inventory.release", {"order_id": order_id})
        
    async def handle_inventory_released(self, order_id):
        # Compensation complete.
        self.save_state(order_id, SagaState.ROLLED_BACK)
        # Optionally notify user order failed.`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Design a Compensating Action',
        description: 'You have a loyalty points service. Step 1 of a Saga is "Add 500 pending points". If the Saga fails, what should the compensating action be? What happens if the compensating action itself fails due to a network error?',
        hint: 'Compensating actions must be resilient to failure themselves.',
        solution: 'The compensating action is "Remove 500 pending points". Because networks fail, the orchestrator must retry the compensating action indefinitely until it succeeds. The compensating action must be idempotent.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Idempotent Compensation',
          filename: 'points.py',
          code: `def rollback_points(transaction_id: str):\n    # transaction_id ensures we don't rollback twice if retried\n    if not already_rolled_back(transaction_id):\n        deduct_points()\n        mark_rolled_back(transaction_id)`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'When should you choose Orchestration over Choreography?',
        answer: 'I prefer Orchestration when the workflow involves more than 3-4 steps, when there is complex rollback/compensation logic, or when I need to easily query the current state of a long-running transaction from a single place.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'What happens if a compensating transaction fails permanently?',
        answer: 'This is a catastrophic failure in a Saga. Since you cannot leave the system in an inconsistent state, you typically require manual intervention. The Saga should be flagged as "Stuck" in the database, and alerts sent to operations teams to manually fix the data.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Compensating actions must NEVER fail due to business logic (e.g., "insufficient balance" when rolling back an added balance). They can only fail due to transient technical errors (network), which are handled by retries.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Phantom Inventory',
        problem: 'A Choreography saga failed at the Payment step. The Payment service emitted a `PaymentFailed` event, but the Inventory service had a bug and didn\'t process it. Inventory was permanently locked, preventing other sales.',
        solution: 'Moved to Orchestration. The orchestrator explicitly tracked the rollback state. When Inventory didn\'t respond to the release command, the orchestrator retried, and eventually alerted engineers of the stuck Saga.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Ignoring Isolation (ACID)',
        description: 'Sagas do not provide Isolation. If Step 1 updates a record, and Step 3 fails 10 minutes later, other transactions might read the data written by Step 1 before it gets rolled back.',
        badCode: {
          id: 'bc-1',
          language: 'text',
          title: 'Dirty Reads',
          code: `Allowing users to spend Loyalty Points that were added in Step 1 of a Saga that hasn't finished yet.`
        },
        goodCode: {
          id: 'gc-1',
          language: 'text',
          title: 'Semantic Lock',
          code: `Marking the points as "Pending" or "Locked" in Step 1, and only converting to "Available" in the final step of the Saga.`
        }
      }
    ],
    codeExamples: [],
  },
  'event-sourcing-basics': {
    id: '11-08',
    slug: 'event-sourcing-basics',
    chapterId: 11,
    order: 8,
    title: 'Event Sourcing Fundamentals',
    description: 'Store state as a sequence of immutable events rather than overwriting current state.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.postgresql, technologies.fastapi],
    prerequisites: ['11-01', '11-06'],
    objectives: [
      'Design an event store schema',
      'Rebuild aggregate state from events',
      'Create projections from event streams',
      'Handle event schema evolution'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'What is Event Sourcing?',
        content: `In traditional CRUD applications, the database stores the *current state*. When a user changes their name, the old name is overwritten and lost forever (unless you have complex audit logs).

**Event Sourcing** flips this. The database does not store current state. It stores a sequence of immutable events (facts). 
1. \`UserCreated(id=1, name="Alice")\`
2. \`NameChanged(id=1, new_name="Alicia")\`

To know the current state, you load all events for that entity and replay them in order. The entity is called an **Aggregate**, and the database is an **Event Store**.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Benefits and Projections',
        content: `*Benefits*: You have a 100% accurate audit log. You can time-travel (query the state of the system as of last Tuesday). You can rebuild read-models at any time.

*Projections*: Querying an event store directly is too slow for UIs (you can't easily ` + "`SELECT * WHERE name='Alicia'`" + `). So, we use **Projections** (or Read Models). A background process listens to the event store, calculates the current state, and saves it to a traditional table specifically designed for fast querying.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Rebuilding State in Python',
        content: `Here is a simple example of rebuilding an aggregate's state from a list of events.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Aggregate Root Rehydration',
          filename: 'aggregate.py',
          code: `class ShoppingCart:
    def __init__(self):
        self.cart_id = None
        self.items = {}
        self.status = "open"
        self.version = 0

    # The "Apply" method mutates state based on an event
    def apply(self, event):
        if event["type"] == "CartCreated":
            self.cart_id = event["cart_id"]
        elif event["type"] == "ItemAdded":
            item_id = event["item_id"]
            qty = event["quantity"]
            self.items[item_id] = self.items.get(item_id, 0) + qty
        elif event["type"] == "CartCheckedOut":
            self.status = "checked_out"
            
        self.version = event["version"]

    # Rehydrate rebuilds the state from history
    @classmethod
    def rehydrate(cls, events: list[dict]):
        cart = cls()
        for event in sorted(events, key=lambda e: e["version"]):
            cart.apply(event)
        return cart

# Usage
event_stream = [
    {"type": "CartCreated", "version": 1, "cart_id": "123"},
    {"type": "ItemAdded", "version": 2, "item_id": "apple", "quantity": 2},
    {"type": "ItemAdded", "version": 3, "item_id": "banana", "quantity": 1},
]

cart = ShoppingCart.rehydrate(event_stream)
print(cart.items) # {'apple': 2, 'banana': 1}
print(cart.version) # 3`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Implement Snapshots',
        description: 'If a Shopping Cart has 10,000 events, loading and replaying all of them every time is too slow. How do you optimize this without losing the event sourcing benefits?',
        hint: 'You can occasionally save the calculated state.',
        solution: 'Implement Snapshots. Every N events (e.g., 100), save the serialized Aggregate state to a snapshot table. To rehydrate, load the latest snapshot, then only load and replay events that occurred *after* the snapshot version.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Snapshot Loading Concept',
          filename: 'snapshot.py',
          code: `def load_cart(cart_id):\n    snapshot = db.get_latest_snapshot(cart_id)\n    if snapshot:\n        cart = ShoppingCart.from_snapshot(snapshot)\n        events = db.get_events(cart_id, from_version=snapshot.version + 1)\n    else:\n        cart = ShoppingCart()\n        events = db.get_events(cart_id, from_version=1)\n        \n    for e in events:\n        cart.apply(e)\n    return cart`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the difference between Event Sourcing and Event-Driven Architecture?',
        answer: 'Event-Driven Architecture uses events to communicate between services (often keeping traditional CRUD DBs internally). Event Sourcing is a data storage pattern where the internal state of an application is fundamentally stored as a sequence of events.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'How do you handle GDPR "Right to be Forgotten" in an immutable Event Store?',
        answer: 'Since events are immutable, you cannot delete or edit the `UserCreated` event. The standard solution is Crypto-Shredding: encrypt PII data inside the event payload, store the encryption key externally, and when a deletion is requested, delete the key. The data in the event store becomes unreadable cyphertext.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Do not use Event Sourcing for everything. It adds massive complexity. Use it only in core domains where history, auditability, and intent are highly valuable (e.g., accounting, legal, complex state machines).'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Missed KPI',
        problem: 'Marketing asked, "How many times did users add an item to the cart, but then remove it?" In the traditional CRUD system, this was impossible because removing an item deleted the record.',
        solution: 'Migrated the cart to Event Sourcing. Because `ItemAdded` and `ItemRemoved` were permanent facts, building a projection to answer marketing\'s question took only a few hours of replaying historical data.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Modifying Past Events',
        description: 'Writing an SQL UPDATE script to fix bad data in past events. This breaks the fundamental law of Event Sourcing.',
        badCode: {
          id: 'bc-1',
          language: 'sql',
          title: 'Breaking Immutability',
          code: `UPDATE event_store SET payload = '{"new_price": 50}' WHERE id = 99;`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Compensating Event',
          code: `# Append a new event to fix the mistake\nappend_event(PriceCorrectedEvent(old_price=100, new_price=50))`
        }
      }
    ],
    codeExamples: [],
  },
  'dead-letter-error-handling': {
    id: '11-09',
    slug: 'dead-letter-error-handling',
    chapterId: 11,
    order: 9,
    title: 'Dead-Letter Queues & Error Handling',
    description: 'Build resilient systems that catch, store, and retry failed asynchronous messages.',
    duration: 40,
    difficulty: 'expert',
    technologies: [technologies.redis, technologies.rabbitmq, technologies.celery],
    prerequisites: ['11-02'],
    objectives: [
      'Configure dead-letter queues in Redis and RabbitMQ',
      'Implement retry with backoff before DLQ',
      'Alert on DLQ growth',
      'Replay events from DLQ after bug fixes'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'Poison Pills and Transient Failures',
        content: `When a consumer processes a message and crashes, the broker typically retries. 
If the failure is **transient** (e.g., database is temporarily down), retrying will eventually succeed.
If the failure is **deterministic** (e.g., a "Poison Pill" message with malformed JSON causing a KeyError), retrying will fail forever.

If the broker retries a poison pill infinitely, the consumer gets stuck, halting all message processing. To solve this, we use **Dead Letter Queues (DLQs)**. After N failed retries, the broker moves the message to a separate queue (the DLQ) and moves on to the next message.`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'The Retry Pipeline',
        content: `A robust architecture involves multiple stages:
1. **Immediate Retry**: Consumer catches exception, throws a specific retry error. Broker retries instantly (good for network blips).
2. **Exponential Backoff**: After 3 immediate failures, push the message to a delayed queue to retry in 5, 25, 125 seconds.
3. **Dead Lettering**: After total attempts exhausted, push to DLQ.
4. **Alerting**: Monitor the DLQ size. If > 0, alert engineers.
5. **Replay**: Engineers fix the bug, deploy new code, and manually move messages from the DLQ back to the main queue for reprocessing.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Configuring DLQ in RabbitMQ (via FastStream)',
        content: `Modern frameworks make setting up DLQs easy. Here is how you define a queue with a dead-letter exchange policy in Python.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'FastStream DLQ Configuration',
          filename: 'worker.py',
          code: `from faststream.rabbit import RabbitBroker, RabbitQueue, RabbitExchange

broker = RabbitBroker("amqp://guest:guest@localhost:5672/")

# Define the Dead Letter Exchange and Queue
dlx_exchange = RabbitExchange("dlx_exchange")
dlq = RabbitQueue("orders_dlq", exchange=dlx_exchange)

# Define the main queue, pointing failures to the DLX
main_queue = RabbitQueue(
    "orders_queue",
    arguments={
        "x-dead-letter-exchange": "dlx_exchange",
        "x-dead-letter-routing-key": "orders_dlq", # Optional routing
        "x-delivery-limit": 3 # RabbitMQ Quorum Queues feature: DLQ after 3 retries
    }
)

@broker.subscriber(main_queue)
async def process_order(msg: dict):
    if "crucial_field" not in msg:
        # This will fail 3 times and then go to DLQ
        raise ValueError("Missing crucial field!")
    print("Processed successfully")`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'The Infinite Loop',
        description: 'You wrote a script to manually pull messages from the DLQ and push them back into the main queue to retry them. However, they immediately failed again and went back to the DLQ. What step did you forget?',
        hint: 'Why did the messages fail in the first place?',
        solution: 'You forgot to identify and fix the underlying bug in the consumer code and deploy it BEFORE replaying the messages. Replaying poison pills into broken code just cycles them back to the DLQ.',
        solutionCode: {
          id: 'sol-1',
          language: 'text',
          title: 'Process Order',
          filename: 'process.txt',
          code: `1. Analyze DLQ message.\n2. Find bug in consumer.\n3. Deploy fix.\n4. Replay DLQ.`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the difference between a retry queue and a dead-letter queue?',
        answer: 'A retry queue holds messages temporarily for automated re-processing (often with backoff delays) when transient errors occur. A dead-letter queue is the final resting place for messages that have exhausted all retries; it requires manual human intervention to investigate and resolve.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'How do you handle schema validation errors upon consuming a message?',
        answer: 'Schema validation errors (e.g., Pydantic validation failures) are deterministic. Retrying them will never succeed. Therefore, they should NOT be retried. The consumer should catch the ValidationError and immediately route the message directly to the DLQ.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'critical',
        content: 'Never configure auto-deletion or TTLs on Dead Letter Queues. DLQ messages represent lost data or failed business processes. They must persist until an engineer manually reviews them.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Silent Failures',
        problem: 'A team implemented error handling by logging exceptions and returning a success acknowledgment to the broker so the queue wouldn\'t block. Weeks later, they realized thousands of orders were silently dropped.',
        solution: 'Removed the fake acknowledgments. Allowed exceptions to bubble up to the broker integration layer, which properly routed failed messages to a monitored DLQ.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Catch-All Acking',
        description: 'Catching general exceptions and acknowledging the message, effectively deleting it on failure.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Silent Drop',
          code: `try:\n    process(msg)\nexcept Exception:\n    log.error("Failed")\n    return # Broker thinks it succeeded!`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Let it crash/DLQ',
          code: `try:\n    process(msg)\nexcept ValidationError:\n    move_to_dlq(msg) # Deterministic\n    ack()\nexcept DbError:\n    nack() # Transient, let broker retry`
        }
      }
    ],
    codeExamples: [],
  },
  'event-schema-evolution': {
    id: '11-10',
    slug: 'event-schema-evolution',
    chapterId: 11,
    order: 10,
    title: 'Event Schema Evolution',
    description: 'Safely change event structures without breaking existing consumers or corrupting history.',
    duration: 45,
    difficulty: 'expert',
    technologies: [technologies.python, technologies.pydantic],
    prerequisites: ['11-01'],
    objectives: [
      'Use additive-only event schema changes',
      'Version events with a version field',
      'Handle multiple event versions in consumers',
      'Use Avro or JSON Schema for schema validation'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Challenge of Evolution',
        content: `Events are contracts between publishers and multiple consumers. Once an event is in production, changing its structure (e.g., renaming a field, removing a field) is a **breaking change** that will crash downstream consumers trying to parse it.

Furthermore, in Event Sourcing, historical events live forever on disk. Your code must be able to read an event generated 3 years ago just as well as an event generated today.

To handle this, we must treat event schemas similarly to public APIs: **evolution must be backward and forward compatible.**`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Evolution Strategies',
        content: `1. **Additive Changes (Non-Breaking)**: The safest way to evolve an event is to only *add* optional fields. Old consumers ignore the new field. New consumers know it might be absent on old messages.
2. **Event Versioning**: Add a \`schema_version\` field to the payload. If you must make a breaking change (e.g., splitting \`name\` into \`first_name\` and \`last_name\`), bump the version to v2. The publisher sends v2. Consumers must implement Upcasters.
3. **Upcasting**: A pattern where the consumer intercepts an old v1 event and transforms it into a v2 event *in memory* before handing it to the business logic. This keeps domain logic clean, dealing only with the newest version.`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'Implementing an Upcaster with Pydantic',
        content: `Here we use Python and Pydantic to handle both v1 and v2 events gracefully using model validation and upcasting.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'Event Upcasting',
          filename: 'schemas.py',
          code: `from pydantic import BaseModel, model_validator
from typing import Optional

# The current standard event (v2)
class UserCreatedEventV2(BaseModel):
    version: int = 2
    user_id: str
    first_name: str
    last_name: str
    
    @model_validator(mode='before')
    @classmethod
    def upcast_v1_to_v2(cls, data: dict) -> dict:
        # If no version is present, or version is 1, upcast it
        version = data.get("version", 1)
        
        if version == 1:
            # v1 had a single "name" field
            full_name = data.get("name", "Unknown")
            parts = full_name.split(" ", 1)
            
            # Transform data to match v2
            data["first_name"] = parts[0]
            data["last_name"] = parts[1] if len(parts) > 1 else ""
            data["version"] = 2
            
            # Remove old field to avoid confusion if strict mode is on
            data.pop("name", None)
            
        return data

# Test with V1 payload
v1_payload = {"user_id": "123", "name": "John Doe", "version": 1}
event = UserCreatedEventV2.model_validate(v1_payload)

print(event.first_name) # "John"
print(event.version)    # 2`
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Handle Field Deletion',
        description: 'You realize the `social_security_number` field in your `UserRegistered` event is a security risk. You want to stop publishing it. How do you evolve the schema safely?',
        hint: 'You cannot just delete the field from Pydantic, because historical events in the queue/store still have it.',
        solution: 'You deprecate the field. Make it Optional in the consumer model. The publisher stops sending it. Old messages process fine (the field is present). New messages process fine (the field is absent).',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Deprecating Fields',
          filename: 'schema.py',
          code: `class UserRegisteredEvent(BaseModel):\n    user_id: str\n    # Make optional, allow None, perhaps add a DeprecationWarning\n    social_security_number: Optional[str] = None`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is a Schema Registry?',
        answer: 'A Schema Registry (like Confluent\'s for Kafka) is a centralized server that stores versions of event schemas (often using Avro or Protobuf). Publishers and consumers validate messages against the registry to guarantee compatibility before sending or receiving, preventing bad data from entering the broker.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'Why is renaming a field considered a breaking change?',
        answer: 'Because old consumers expecting the original field name will fail to parse the message, as the required field is now missing. Renaming is functionally identical to deleting the old field and adding a new, unrelated field.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'info',
        content: 'When using Pydantic for events, consider setting `extra = "ignore"` in the model config. This allows the publisher to add new fields (additive changes) without crashing older consumers that haven\'t been updated yet.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Deployment Race Condition',
        problem: 'A team updated an event schema (breaking change) and deployed the publisher and consumer simultaneously. However, there were 10,000 old-format events still in the queue. The new consumer crashed immediately upon starting.',
        solution: 'Rolled back the consumer. Implemented a Two-Phase Deploy: 1. Deploy consumer that handles BOTH old and new formats (Upcaster). 2. Deploy publisher emitting new format. 3. (Weeks later) Remove old format handling if queue is guaranteed empty.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Strict Validation on Consumers',
        description: 'Using extremely strict parsing rules that crash if an unknown field is present, preventing publishers from making safe additive changes.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Extra Forbid',
          code: `class Event(BaseModel):\n    model_config = ConfigDict(extra="forbid") # BAD for events`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Extra Ignore',
          code: `class Event(BaseModel):\n    model_config = ConfigDict(extra="ignore") # Good for forward compatibility`
        }
      }
    ],
    codeExamples: [],
  },
  'cqrs-pattern': {
    id: '11-11',
    slug: 'cqrs-pattern',
    chapterId: 11,
    order: 11,
    title: 'CQRS: Command Query Responsibility Segregation',
    description: 'Separate write models from read models to optimize performance and scale independently.',
    duration: 50,
    difficulty: 'expert',
    technologies: [technologies.fastapi, technologies.postgresql],
    prerequisites: ['11-01', '11-05'],
    objectives: [
      'Design separate command and query handlers',
      'Build read models (projections) for query optimization',
      'Synchronize write and read models via events',
      'Know when NOT to use CQRS'
    ],
    sections: [
      {
        id: 'concept',
        type: 'concept',
        title: 'The Bottleneck of CRUD',
        content: `In a traditional CRUD system, the same database model is used for both writing data (Commands) and reading data (Queries).

As systems grow, read and write requirements diverge. Writes require strict validation, normalization, and locking to ensure consistency. Reads require complex joins, denormalization, and fast retrieval. Optimizing a table for writes (3rd normal form) makes reads slow (too many JOINs). Optimizing for reads (indexes) makes writes slow.

**CQRS (Command Query Responsibility Segregation)** splits the architecture in two:
1. **Command Side**: Handles business logic and writes to a Write Database (optimized for consistency).
2. **Query Side**: Handles API GET requests by reading from a Read Database (optimized for speed, heavily denormalized).`
      },
      {
        id: 'architecture',
        type: 'architecture',
        title: 'Synchronizing Models with Events',
        content: `How do data changes in the Write Model reach the Read Model? Events.

When the Command Side successfully updates data, it publishes an event (e.g., \`UserProfileUpdated\`). A background worker (the Projector) listens to this event and updates the Query Side database. 

This introduces **Eventual Consistency** (covered in 11-05), which is the primary trade-off of CQRS. The read models can be entirely different technologies (e.g., Write to PostgreSQL, project events to Elasticsearch for searching).`
      },
      {
        id: 'implementation',
        type: 'implementation',
        title: 'CQRS Directory Structure and Handlers',
        content: `In FastAPI, CQRS is often implemented by separating routers, schemas, and services into commands and queries.`,
        codeExample: {
          id: 'code-1',
          language: 'python',
          title: 'CQRS Multi-File Structure',
          files: {
            'commands/schemas.py': {
              language: 'python',
              code: `from pydantic import BaseModel\n\nclass CreateArticleCommand(BaseModel):\n    title: str\n    content: str\n    author_id: int`
            },
            'commands/handlers.py': {
              language: 'python',
              code: `from sqlalchemy.orm import Session\n# Write Model (Normalized)\nfrom models.write import Article\nfrom broker import publish\n\ndef handle_create_article(db: Session, cmd: CreateArticleCommand):\n    article = Article(title=cmd.title, content=cmd.content, author_id=cmd.author_id)\n    db.add(article)\n    db.commit()\n    \n    # Publish Event\n    publish("ArticleCreated", {"id": article.id, "title": article.title, "author_id": article.author_id})\n    return article.id`
            },
            'queries/schemas.py': {
              language: 'python',
              code: `from pydantic import BaseModel\n\n# Optimized for the UI, includes author name (no join needed!)\nclass ArticleSummaryReadModel(BaseModel):\n    id: int\n    title: str\n    author_name: str`
            },
            'queries/handlers.py': {
              language: 'python',
              code: `from sqlalchemy.orm import Session\n# Read Model (Denormalized, flat table)\nfrom models.read import ArticleSummaryView\n\ndef get_article_summaries(db: Session):\n    # Blazing fast, no joins, just a direct select from a flat table\n    return db.query(ArticleSummaryView).all()`
            }
          }
        }
      }
    ],
    challenges: [
      {
        id: 'chal-1',
        title: 'Implement the Projector',
        description: 'You have the Write model working. Now write the consumer that listens to `ArticleCreated` and `AuthorNameChanged` events to update the denormalized `ArticleSummaryView` read model.',
        hint: 'The read model needs to be updated when the article is created, AND when the author changes their name (updating all their articles).',
        solution: 'The projector handles multiple event types. It inserts on ArticleCreated. On AuthorNameChanged, it runs an update query across all records matching the author_id in the flat read model.',
        solutionCode: {
          id: 'sol-1',
          language: 'python',
          title: 'Projector Worker',
          filename: 'projector.py',
          code: `def handle_article_created(db, event):\n    view = ArticleSummaryView(\n        id=event["id"], \n        title=event["title"], \n        author_name=get_author_name(event["author_id"])\n    )\n    db.add(view)\n    db.commit()\n\ndef handle_author_name_changed(db, event):\n    # Update denormalized data\n    db.query(ArticleSummaryView).filter_by(author_id=event["author_id"]).update({"author_name": event["new_name"]})\n    db.commit()`
        }
      }
    ],
    interviewQuestions: [
      {
        id: 'iq-1',
        question: 'What is the relationship between CQRS and Event Sourcing?',
        answer: 'They are distinct but highly complementary. Event Sourcing is a way to store data (as a log of events). Because you cannot efficiently query an event log, you practically *must* use CQRS to build queryable read models (projections) from those events.',
        difficulty: 'expert'
      },
      {
        id: 'iq-2',
        question: 'When should you NOT use CQRS?',
        answer: 'You should not use CQRS for simple CRUD applications where the read and write models are identical. CQRS introduces significant complexity, eventual consistency, and data duplication overhead. It should only be used in complex domains with high read/write disparity.',
        difficulty: 'expert'
      }
    ],
    productionNotes: [
      {
        id: 'pn-1',
        severity: 'warning',
        content: 'Read models can be destroyed and rebuilt at any time from the event stream. Treat read-model databases as disposable caches rather than sources of truth.'
      }
    ],
    realWorldScenarios: [
      {
        id: 'rw-1',
        scenario: 'The Dashboard of Doom',
        problem: 'A complex analytics dashboard required 12 SQL JOINs across massive tables, taking 30 seconds to load and locking tables, causing writes to timeout.',
        solution: 'Implemented CQRS. Created a read-only MongoDB projection specifically structured to match the JSON response the dashboard UI required. The dashboard load time went from 30 seconds to 15 milliseconds, and write-locks were eliminated.'
      }
    ],
    commonMistakes: [
      {
        id: 'cm-1',
        title: 'Reusing Schemas',
        description: 'Using the exact same SQLAlchemy models for both commands and queries, completely defeating the purpose of segregation.',
        badCode: {
          id: 'bc-1',
          language: 'python',
          title: 'Shared Model',
          code: `# Using same model for Write validation and Read output\nreturn db.query(WriteDomainModel).all()`
        },
        goodCode: {
          id: 'gc-1',
          language: 'python',
          title: 'Segregated Models',
          code: `# Return a specific View model\nreturn db.query(ReadViewModel).all()`
        }
      }
    ],
    codeExamples: [],
  }
};
