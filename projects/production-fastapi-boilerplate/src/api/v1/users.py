import math
from fastapi import APIRouter, Depends, status, Query
from src.core.dependencies import get_user_service, require_role, get_current_user
from src.models.user import UserModel, UserRole
from src.services.user_service import UserService
from src.schemas.common import APIResponse, PaginatedResponse
from src.schemas.user import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.post("", response_model=APIResponse[UserOut], status_code=status.HTTP_201_CREATED, summary="Create User")
async def create_user(
    payload: UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    user = await user_service.create_user(payload)
    return APIResponse(message="User created successfully", data=UserOut.model_validate(user))


@router.get("", response_model=APIResponse[PaginatedResponse[UserOut]], summary="List Users (Admin only)")
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_service: UserService = Depends(get_user_service),
    _: UserModel = Depends(require_role(UserRole.ADMIN))
):
    users, total = await user_service.list_users(page=page, size=size)
    return APIResponse(
        data=PaginatedResponse(
            items=[UserOut.model_validate(u) for u in users],
            total=total,
            page=page,
            size=size,
            total_pages=math.ceil(total / size) if size > 0 else 1
        )
    )


@router.get("/{user_id}", response_model=APIResponse[UserOut], summary="Get User By ID")
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
    current_user: UserModel = Depends(get_current_user)
):
    user = await user_service.get_by_id(user_id)
    return APIResponse(data=UserOut.model_validate(user))


@router.patch("/{user_id}/role", response_model=APIResponse[UserOut], summary="Update User Role (Admin only)")
async def update_user_role(
    user_id: int,
    payload: UserUpdate,
    user_service: UserService = Depends(get_user_service),
    _: UserModel = Depends(require_role(UserRole.ADMIN))
):
    updated = await user_service.update_user(user_id, payload)
    return APIResponse(message="User role updated", data=UserOut.model_validate(updated))
