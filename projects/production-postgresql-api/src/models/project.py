"""
Project Model with Composite Unique Constraint and Optimistic Locking
=====================================================================
Senior Design Note:
1. `UniqueConstraint('org_id', 'code')`: Ensures project codes (e.g. 'INFRA-01') are unique within
   an organization, but distinct organizations can safely use identical project codes.
2. `version_id`: Used for Optimistic Concurrency Control (OCC). Prevents the 'lost update' anomaly
   without holding heavy pessimistic table locks.
"""

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin, SoftDeleteMixin


class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class ProjectModel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "projects"
    __table_args__ = (
        UniqueConstraint("org_id", "code", name="uq_org_project_code"),
        Index("ix_projects_org_status", "org_id", "status"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    
    # Optimistic locking version integer
    version_id = Column(Integer, default=1, nullable=False)

    organization = relationship("OrganizationModel", back_populates="projects")
    tasks = relationship("TaskModel", back_populates="project", cascade="all, delete-orphan")
