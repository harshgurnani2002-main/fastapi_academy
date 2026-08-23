from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "API Performance Optimization"
    APP_VERSION: str = "15.0.0"
    ENVIRONMENT: str = "production"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./perf_db.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()
