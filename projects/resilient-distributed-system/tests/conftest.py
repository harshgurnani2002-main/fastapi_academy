import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.core.circuit_breaker import cb, CircuitState

@pytest.fixture(autouse=True)
def reset_cb():
    cb.state = CircuitState.CLOSED
    cb.failure_count = 0

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
