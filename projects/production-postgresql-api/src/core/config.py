"""
Core Application Configuration
==============================
Architectural Note (Senior Engineer):
Production database connection pooling requires careful sizing.
Formula: pool_size = ((core_count * 2) + effective_spindle_count) * headroom_factor
In cloud microservices (e.g. AWS ECS / K8s), setting pool_size too large per pod
causes PostgreSQL connection exhaustion (max_connections = 100 on standard RDS).
We enforce pool_pre_ping=True to discard dead connections and pool_recycle to recycle
stale socket handles before cloud load balancers drop them silently.
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

    APP_NAME: str = "Production-Grade PostgreSQL API"
    APP_VERSION: str = "3.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["*"]

    # ==========================================
    # Database & Async Connection Pool Settings
    # ==========================================
    DATABASE_URL: str = "sqlite+aiosqlite:///./postgres_optimized.db"
    
    # Connection Pool Tuning Parameters
    DB_POOL_SIZE: int = Field(default=10, description="Base steady-state connection pool size per worker")
    DB_MAX_OVERFLOW: int = Field(default=20, description="Burst connections above pool_size during spike load")
    DB_POOL_TIMEOUT: int = Field(default=30, description="Seconds to wait before raising TimeoutError when pool is full")
    DB_POOL_RECYCLE: int = Field(default=1800, description="Recycle connections after 30 minutes to avoid stale sockets")
    DB_POOL_PRE_PING: bool = Field(default=True, description="Execute test SELECT 1 before checkout to heal broken sockets")
    DB_ECHO: bool = False

    # Observability
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
