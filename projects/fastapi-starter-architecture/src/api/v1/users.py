import math
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_user_service
from src.services.user_service import UserService
from src.schemas.common import APIResponse, PaginatedResponse
from src.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED, summary="Create User")
async def create_user(
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    """Register and create a new system user."""
    user = await user_service.create_user(payload)
    return APIResponse(message="User created successfully", data=UserResponse.model_validate(user))


@router.get("", response_model=APIResponse[PaginatedResponse[UserResponse]], summary="List Users")
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_service: UserService = Depends(get_user_service)
):
    """Retrieve a paginated list of users."""
    users, total = await user_service.list_users(page=page, size=size)
    total_pages = math.ceil(total / size) if size > 0 else 1
    
    return APIResponse(
        data=PaginatedResponse(
            items=[UserResponse.model_validate(u) for u in users],
            total=total,
            page=page,
            size=size,
            total_pages=total_pages
        )
    )


@router.get("/{user_id}", response_model=APIResponse[UserResponse], summary="Get User by ID")
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    """Retrieve details for a specific user."""
    user = await user_service.get_user_by_id(user_id)
    return APIResponse(data=UserResponse.model_validate(user))


@router.put("/{user_id}", response_model=APIResponse[UserResponse], summary="Update User")
async def update_user(
    user_id: int,
    payload: UserUpdate,
    user_service: UserService = Depends(get_user_service)
):
    """Update profile information for an existing user."""
    user = await user_service.update_user(user_id, payload)
    return APIResponse(message="User updated successfully", data=UserResponse.model_validate(user))


@router.delete("/{user_id}", response_model=APIResponse[dict], summary="Delete User")
async def delete_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    """Delete a user from the system."""
    await user_service.delete_user(user_id)
    return APIResponse(message=f"User {user_id} deleted successfully", data={"deleted": True, "id": user_id})
