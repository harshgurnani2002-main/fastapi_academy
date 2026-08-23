import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from src.core.telemetry import metrics_registry
from src.main import create_application


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def reset_metrics():
    metrics_registry.clear()
    yield
    metrics_registry.clear()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app = create_application()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
