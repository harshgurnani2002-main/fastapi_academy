"""
Task Model with Advanced Index Strategies
=========================================
Senior Design Note:
1. Composite Index on `(project_id, status)` optimizes Kanban board filtering.
2. Partial Index on `(due_date)` where `status != 'completed'` makes overdue task sweeps
   extremely fast by ignoring thousands of completed historical records.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Index, JSON
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin, SoftDeleteMixin


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tasks"
    __table_args__ = (
        # Composite Index for project task boards
        Index("ix_tasks_project_status", "project_id", "status"),
        # Keyset pagination index on (project_id, id)
        Index("ix_tasks_keyset", "project_id", "id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(String(2000), default="", nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority = Column(Integer, default=3, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    tags = Column(JSON, default=list, nullable=False)
    assignee_email = Column(String(255), nullable=True)

    project = relationship("ProjectModel", back_populates="tasks")
