"""
Production Caching Layer Configuration
======================================
Senior Design Note:
L1 cache uses an in-memory LRU cache for ultra-low latency (<0.1ms).
L2 cache uses Redis for distributed consistency with jittered TTL to avoid cache avalanche.
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

    APP_NAME: str = "Production Caching Layer"
    APP_VERSION: str = "8.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["*"]
    DATABASE_URL: str = "sqlite+aiosqlite:///./caching_db.db"
    DATABASE_ECHO: bool = False

    # Cache Configuration
    L1_MAX_SIZE: int = 1000
    L1_DEFAULT_TTL_SEC: int = 60         # 1 min in-process
    L2_DEFAULT_TTL_SEC: int = 300        # 5 mins Redis
    NEGATIVE_CACHE_TTL_SEC: int = 30     # 30s for 404s
    TTL_JITTER_PERCENTAGE: float = 0.15  # ±15% jitter

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
