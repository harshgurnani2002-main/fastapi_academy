"""
Production Auth Service Configuration
=====================================
Senior Design Note:
Access tokens should have a short TTL (15 minutes) to minimize the attack surface
if intercepted. Refresh tokens have longer TTL (7 days) and are bound to rotating
token families. If a compromised refresh token is replayed, the entire token family
is immediately revoked in Redis and database.
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

    APP_NAME: str = "Production Authentication Platform"
    APP_VERSION: str = "5.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 2

    ALLOWED_ORIGINS: List[str] = ["*"]
    DATABASE_URL: str = "sqlite+aiosqlite:///./auth_platform.db"
    DATABASE_ECHO: bool = False

    # Cryptographic & Token Settings
    JWT_SECRET_KEY: str = "super-secret-auth-platform-signing-key-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 mins
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days
    
    # OAuth 2.0 PKCE Settings
    OAUTH_GOOGLE_CLIENT_ID: str = "mock-google-client-id.apps.googleusercontent.com"
    OAUTH_GOOGLE_CLIENT_SECRET: str = "mock-google-client-secret"
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/oauth/google/callback"

    # Password Policy
    PASSWORD_MIN_LENGTH: int = 8
    
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
