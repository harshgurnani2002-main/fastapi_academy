"""
Idempotency Ledger Table
========================
Stores cached API responses keyed by unique client tokens.
Enables transparent request replay without duplicate execution.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum
from src.models.base import Base, TimestampMixin


class IdempotencyState(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IdempotencyModel(Base, TimestampMixin):
    __tablename__ = "idempotency_records"

    key = Column(String(100), primary_key=True, index=True)
    request_hash = Column(String(64), nullable=False)
    state = Column(Enum(IdempotencyState), default=IdempotencyState.PROCESSING, nullable=False)
    response_code = Column(Integer, nullable=True)
    response_body = Column(JSON, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
