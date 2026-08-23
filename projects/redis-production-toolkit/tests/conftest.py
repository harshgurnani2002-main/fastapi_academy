import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from src.core.redis_client import AsyncRedisEngine, get_redis, redis_engine
from src.main import create_application


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def reset_redis_engine():
    # Fresh in-memory engine per test
    redis_engine._strings.clear()
    redis_engine._hashes.clear()
    redis_engine._zsets.clear()
    redis_engine._streams.clear()
    redis_engine._groups.clear()
    redis_engine._expires.clear()
    redis_engine._pubsub_subscribers.clear()
    redis_engine.stats_hits = 0
    redis_engine.stats_misses = 0
    yield


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app = create_application()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
