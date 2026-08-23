"""
Application Configuration & Concurrency Controls
================================================
Senior Design Note:
In high-throughput ticketing systems (e.g. Ticketmaster, LiveNation), hold TTLs
must be strictly enforced. A 10-minute hold window balances user checkout time
against hoarding inventory. Idempotency keys prevent duplicate payments and duplicate
ticket creation across client retries during network interruptions.
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

    APP_NAME: str = "Concurrent Ticket Booking System"
    APP_VERSION: str = "4.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["*"]
    DATABASE_URL: str = "sqlite+aiosqlite:///./ticket_booking.db"
    DATABASE_ECHO: bool = False

    # Concurrency & Idempotency Settings
    TICKET_HOLD_TTL_SECONDS: int = Field(default=600, description="Ticket hold duration in seconds (10 mins)")
    IDEMPOTENCY_TTL_SECONDS: int = Field(default=86400, description="Idempotency key cache lifetime (24 hours)")
    MAX_CONCURRENT_SIMULATION_USERS: int = 50

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
