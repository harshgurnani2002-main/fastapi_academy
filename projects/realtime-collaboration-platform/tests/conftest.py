import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from starlette.testclient import TestClient
from src.core.connection_manager import manager
from src.main import create_application


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def reset_manager():
    manager.clear()
    yield
    manager.clear()


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    app = create_application()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.fixture
def sync_client() -> TestClient:
    app = create_application()
    return TestClient(app)
