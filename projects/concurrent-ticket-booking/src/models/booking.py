"""
Booking Ledger Model
====================
Senior Design Note:
Unique constraint on `idempotency_key` guarantees at the database level that no client
can ever create duplicate booking records for the same transaction token.
"""

import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class BookingModel(Base, TimestampMixin):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_booking_idempotency_key"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, unique=True)
    customer_email = Column(String(255), nullable=False, index=True)
    seat_number = Column(String(20), nullable=False)
    amount_paid = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    idempotency_key = Column(String(100), nullable=False, index=True)

    event = relationship("EventModel", back_populates="bookings")
