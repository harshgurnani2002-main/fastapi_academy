import pytest
from unittest.mock import AsyncMock
from src.core.exceptions import ConflictException, NotFoundException
from src.schemas.user import UserCreate
from src.services.user_service import UserService


@pytest.mark.asyncio
async def test_user_service_create_conflict():
    """Unit test user service conflict detection with mocked repository."""
    mock_repo = AsyncMock()
    mock_repo.exists_by_email.return_value = True

    service = UserService(mock_repo)
    payload = UserCreate(
        email="exists@example.com",
        username="newuser",
        full_name="New User",
        password="password123"
    )

    with pytest.raises(ConflictException) as exc_info:
        await service.create_user(payload)
    
    assert "already exists" in str(exc_info.value)
