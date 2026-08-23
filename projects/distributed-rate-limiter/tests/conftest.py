import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from src.core.redis_engine import redis_engine
from src.main import create_application


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def reset_redis():
    redis_engine.clear()
    yield
    redis_engine.clear()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app = create_application()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
