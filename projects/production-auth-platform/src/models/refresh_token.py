"""
Refresh Token Model with Token Family Invalidation
==================================================
Senior Design Note:
Refresh Token Rotation (RTR):
Every refresh request issues a NEW refresh token and marks the current one as `is_used=True`.
If an already used token is presented again, it indicates that an attacker has stolen the old token.
The server detects this replay and revokes all tokens belonging to that `family_id`.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class RefreshTokenModel(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_tokens_family", "family_id"),
        Index("ix_tokens_hash", "token_hash"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False)
    family_id = Column(String(64), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("UserModel", back_populates="refresh_tokens")
