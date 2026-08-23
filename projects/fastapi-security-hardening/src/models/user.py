from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from src.models.base import Base, TimestampMixin


class UserModel(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    documents = relationship("DocumentModel", back_populates="owner", cascade="all, delete-orphan")
