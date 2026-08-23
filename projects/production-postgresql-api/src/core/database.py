"""
Database Engine & Connection Pool Infrastructure
=================================================
Senior Design Note:
SQLAlchemy 2.x async engine handles connection pools in asynchronous event loops.
We configure `expire_on_commit=False` on `async_sessionmaker` to prevent accidental
lazy-load attribute access errors after commits outside active async context blocks.
"""

from typing import AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from src.core.config import get_settings
from src.models.base import Base

settings = get_settings()

is_sqlite = "sqlite" in settings.DATABASE_URL

engine_kwargs: Dict[str, Any] = {
    "echo": settings.DB_ECHO,
    "future": True,
}

if is_sqlite:
    # SQLite requires thread-safety flags for in-memory or file-based async testing
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL production pool configuration
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT
    engine_kwargs["pool_recycle"] = settings.DB_POOL_RECYCLE
    engine_kwargs["pool_pre_ping"] = settings.DB_POOL_PRE_PING

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def init_db() -> None:
    """Initialize schema tables during application startup lifespan."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Gracefully terminate engine and drain active connection pools."""
    await engine.dispose()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an isolated AsyncSession per request.
    Rolls back automatically on unhandled exceptions to prevent connection taint.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_pool_status() -> Dict[str, Any]:
    """Inspect active pool metrics for diagnostics and Prometheus export."""
    pool = engine.pool
    return {
        "pool_size": getattr(pool, "size", lambda: 0)(),
        "checked_in_connections": getattr(pool, "checkedin", lambda: 0)(),
        "checked_out_connections": getattr(pool, "checkedout", lambda: 0)(),
        "overflow": getattr(pool, "overflow", lambda: 0)(),
        "is_sqlite": is_sqlite
    }
