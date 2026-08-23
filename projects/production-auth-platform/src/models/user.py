import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    DEVELOPER = "developer"
    USER = "user"
    AUDITOR = "auditor"


class UserModel(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for pure OAuth accounts
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    scopes = Column(JSON, default=list, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # MFA Settings
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(64), nullable=True)

    refresh_tokens = relationship("RefreshTokenModel", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKeyModel", back_populates="user", cascade="all, delete-orphan")
