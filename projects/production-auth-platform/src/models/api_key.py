from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON, Index
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class ApiKeyModel(Base, TimestampMixin):
    __tablename__ = "api_keys"
    __table_args__ = (
        Index("ix_api_keys_hash", "key_hash"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    key_prefix = Column(String(16), nullable=False)  # e.g. "ak_live_7f8a"
    key_hash = Column(String(64), unique=True, nullable=False)
    scopes = Column(JSON, default=list, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("UserModel", back_populates="api_keys")
