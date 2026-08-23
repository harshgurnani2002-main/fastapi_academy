"""
Transactional Outbox & Idempotent Consumer Schema
=================================================
Senior Design Note:
1. `orders`: Domain aggregate table.
2. `outbox_events`: Events committed atomically inside the exact same DB transaction as orders.
3. `processed_events`: Deduplication ledger per (event_id, consumer_name) ensuring consumers achieve exactly-once semantics.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, DateTime, UniqueConstraint
from src.models.base import Base, TimestampMixin, utc_now


class OrderModel(Base, TimestampMixin):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_email = Column(String(120), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(30), default="CREATED", nullable=False)  # CREATED, PROCESSING, PAID, SHIPPED, CANCELLED


class OutboxEventModel(Base, TimestampMixin):
    __tablename__ = "outbox_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    aggregate_type = Column(String(50), nullable=False)  # "ORDER"
    aggregate_id = Column(String(50), nullable=False)    # order_number
    event_type = Column(String(50), nullable=False)      # "OrderCreated", "OrderPaid"
    payload = Column(JSON, nullable=False)
    published = Column(Boolean, default=False, index=True, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)


class ProcessedEventModel(Base, TimestampMixin):
    __tablename__ = "processed_events"
    __table_args__ = (UniqueConstraint("event_id", "consumer_name", name="uq_event_consumer"),)

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    consumer_name = Column(String(50), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
