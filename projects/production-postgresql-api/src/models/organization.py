import enum
from sqlalchemy import Column, Integer, String, Enum, JSON
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin, SoftDeleteMixin


class OrgTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class OrganizationModel(Base, TimestampMixin, SoftDeleteMixin):
    """
    Tenant Organization Root Entity.
    Indexed on slug for sub-millisecond subdomain/tenant resolution.
    """
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    tier = Column(Enum(OrgTier), default=OrgTier.PRO, nullable=False)
    settings_json = Column(JSON, default=dict, nullable=False)

    # 1-to-Many Relationship with Projects
    projects = relationship("ProjectModel", back_populates="organization", cascade="all, delete-orphan")
