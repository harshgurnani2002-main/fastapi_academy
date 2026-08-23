import re

# Update requirements.txt to include email-validator
with open("projects/fastapi-starter-architecture/requirements.txt", "w") as f:
    f.write("""fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic[email]>=2.6.0
pydantic-settings>=2.1.0
email-validator>=2.0.0
sqlalchemy>=2.0.25
aiosqlite>=0.19.0
httpx>=0.26.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
""")

# Fix datetime.utcnow in db/models.py
models_code = '''from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.db.base import Base


def utc_now():
    return datetime.now(timezone.utc)


class UserModel(Base):
    """SQLAlchemy model for Users table."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    items = relationship("ItemModel", back_populates="owner", cascade="all, delete-orphan")


class ItemModel(Base):
    """SQLAlchemy model for Items table."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), index=True, nullable=False)
    description = Column(String(2000), default="", nullable=False)
    price = Column(Float, nullable=False)
    is_published = Column(Boolean, default=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    owner = relationship("UserModel", back_populates="items")
'''
with open("projects/fastapi-starter-architecture/src/db/models.py", "w") as f:
    f.write(models_code)

# Fix health.py
health_code = '''from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Dict, Any


class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Service health state")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: str
    environment: str


class ReadinessResponse(BaseModel):
    status: str = "ready"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    checks: Dict[str, str] = Field(default_factory=dict)
'''
with open("projects/fastapi-starter-architecture/src/schemas/health.py", "w") as f:
    f.write(health_code)

print("Updated models and health schemas.")
