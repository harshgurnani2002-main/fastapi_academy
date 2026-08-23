"""
Security Hardening Configuration
=================================
Senior Design Note:
Centralizes security policies: IP rate limit thresholds, private IP blocklists,
allowed MIME types, and secure response headers.
"""

from functools import lru_cache
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "FastAPI Security Hardening Lab"
    APP_VERSION: str = "6.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["https://trusted-domain.com", "https://app.fastapi-academy.io"]
    DATABASE_URL: str = "sqlite+aiosqlite:///./security_lab.db"
    DATABASE_ECHO: bool = False

    JWT_SECRET_KEY: str = "security-hardening-vault-key-min-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rate Limiting (Token Bucket / Sliding Window)
    RATE_LIMIT_PER_MINUTE: int = 60

    # Uploads & Storage
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".png", ".jpg", ".jpeg", ".txt"]
    UPLOAD_SANDBOX_DIR: str = "./uploads_sandbox"

    LOG_LEVEL: str = "INFO"
    CORRELATION_ID_HEADER: str = "X-Correlation-ID"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [x.strip() for x in v.split(",") if x.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
