"""
Event Model with Finite Capacity Counter
========================================
Senior Design Note:
`available_tickets` is maintained as a denormalized counter on EventModel for fast
read-heavy capacity queries, while individual seat state is tracked in TicketModel.
When reserving, both rows are locked under `SELECT FOR UPDATE` inside the same transaction.
"""

from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class EventModel(Base, TimestampMixin):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    title = Column(String(150), nullable=False)
    venue = Column(String(100), nullable=False)
    total_capacity = Column(Integer, nullable=False)
    available_tickets = Column(Integer, nullable=False)
    ticket_price = Column(Float, nullable=False)

    tickets = relationship("TicketModel", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("BookingModel", back_populates="event", cascade="all, delete-orphan")
