from fastapi import APIRouter, Depends, Header
from src.core.dependencies import get_current_user, require_roles, require_scopes, get_api_key_service
from src.core.exceptions import UnauthorizedException
from src.models.user import UserModel, UserRole
from src.services.api_key_service import ApiKeyService
from src.schemas.common import APIResponse

router = APIRouter(prefix="/protected", tags=["Protected & Scoped Endpoints"])


@router.get("/admin-only", response_model=APIResponse[dict], summary="Admin Role Guard")
async def admin_protected_route(
    current_user: UserModel = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN))
):
    return APIResponse(data={"access": "granted", "role": current_user.role.value, "admin": True})


@router.get("/billing-write", response_model=APIResponse[dict], summary="Scoped Guard (billing:write)")
async def billing_protected_route(
    current_user: UserModel = Depends(require_scopes("billing:write"))
):
    return APIResponse(data={"access": "granted", "scope": "billing:write", "user": current_user.email})


@router.get("/service-m2m", response_model=APIResponse[dict], summary="Machine-to-Machine API Key Guard")
async def service_m2m_route(
    x_api_key: str = Header(None, alias="X-API-Key"),
    api_key_service: ApiKeyService = Depends(get_api_key_service)
):
    if not x_api_key:
        raise UnauthorizedException("Missing X-API-Key header.")

    key_record = await api_key_service.verify_key(x_api_key)
    if not key_record:
        raise UnauthorizedException("Invalid or revoked API Key.")

    return APIResponse(data={"access": "granted", "service_key_id": key_record.id, "scopes": key_record.scopes})
