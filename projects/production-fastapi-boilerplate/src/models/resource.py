import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class ResourceStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ResourceModel(Base, TimestampMixin):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(String(2000), default="", nullable=False)
    category = Column(String(50), default="general", index=True, nullable=False)
    status = Column(Enum(ResourceStatus), default=ResourceStatus.ACTIVE, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, default=1, nullable=False)

    owner = relationship("UserModel", back_populates="resources")
