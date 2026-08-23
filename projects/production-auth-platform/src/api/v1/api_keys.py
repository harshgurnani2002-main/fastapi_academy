from typing import List
from fastapi import APIRouter, Depends, status
from src.core.dependencies import get_current_user, get_api_key_service
from src.models.user import UserModel
from src.services.api_key_service import ApiKeyService
from src.schemas.common import APIResponse
from src.schemas.api_key import ApiKeyCreateRequest, ApiKeyCreatedResponse, ApiKeyOut

router = APIRouter(prefix="/api-keys", tags=["API Keys Management"])


@router.post("", response_model=APIResponse[ApiKeyCreatedResponse], status_code=status.HTTP_201_CREATED, summary="Create API Key")
async def create_api_key(
    payload: ApiKeyCreateRequest,
    current_user: UserModel = Depends(get_current_user),
    api_key_service: ApiKeyService = Depends(get_api_key_service)
):
    created = await api_key_service.create_key(current_user.id, payload)
    return APIResponse(message="API Key generated", data=created)


@router.get("", response_model=APIResponse[List[ApiKeyOut]], summary="List User API Keys")
async def list_api_keys(
    current_user: UserModel = Depends(get_current_user),
    api_key_service: ApiKeyService = Depends(get_api_key_service)
):
    keys = await api_key_service.list_keys(current_user.id)
    return APIResponse(data=[ApiKeyOut.model_validate(k) for k in keys])
