"""
Async Document Processing Platform Config
=========================================
Senior Design Note:
Defines task retry thresholds, exponential backoff multipliers,
and Dead Letter Queue (DLQ) retention policies.
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

    APP_NAME: str = "Async Document Processing Platform"
    APP_VERSION: str = "10.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["*"]
    REDIS_URL: str = "redis://localhost:6379/0"

    # Worker & Task Execution Configuration
    MAX_TASK_RETRIES: int = 3
    RETRY_BASE_DELAY_SEC: float = 0.5
    RETRY_BACKOFF_FACTOR: float = 2.0
    TASK_TIMEOUT_SEC: float = 30.0

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
