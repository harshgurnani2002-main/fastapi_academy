"""
Redis Production Toolkit Configuration
======================================
Senior Design Note:
Defines connection pooling limits, socket timeouts, lock retry parameters,
and stream buffer sizes for high-performance Redis architectures.
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

    APP_NAME: str = "Redis Production Toolkit"
    APP_VERSION: str = "7.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["*"]
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50
    REDIS_SOCKET_TIMEOUT: float = 2.0
    REDIS_CONNECT_TIMEOUT: float = 2.0

    # Distributed Lock Defaults
    LOCK_DEFAULT_TTL_SEC: int = 10
    LOCK_ACQUIRE_TIMEOUT_SEC: float = 3.0

    # Rate Limiting
    RATE_LIMIT_DEFAULT_REQUESTS: int = 10
    RATE_LIMIT_WINDOW_MS: int = 60000  # 60s in ms

    # Streams
    STREAM_MAX_LEN: int = 50000

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
