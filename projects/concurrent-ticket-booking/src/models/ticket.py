"""
Ticket Model with Hold TTL & State Machine
==========================================
States: AVAILABLE -> HELD (10 min TTL) -> BOOKED
"""

import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class TicketStatus(str, enum.Enum):
    AVAILABLE = "available"
    HELD = "held"
    BOOKED = "booked"


class TicketModel(Base, TimestampMixin):
    __tablename__ = "tickets"
    __table_args__ = (
        UniqueConstraint("event_id", "seat_number", name="uq_event_seat"),
        Index("ix_tickets_event_status", "event_id", "status"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    seat_number = Column(String(20), nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.AVAILABLE, nullable=False)
    price = Column(Float, nullable=False)
    
    # Hold TTL expiration
    held_until = Column(DateTime(timezone=True), nullable=True)
    held_by_user = Column(String(100), nullable=True)

    event = relationship("EventModel", back_populates="tickets")
