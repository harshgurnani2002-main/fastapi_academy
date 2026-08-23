from fastapi import APIRouter, Depends, Header, Request, status
from typing import Optional
from src.core.session_store import InMemoryDistributedSessionStore, get_session_store
from src.core.exceptions import UnauthorizedSessionException
from src.schemas.common import APIResponse
from src.schemas.session import LoginRequest, SessionOut, ActiveSessionsList

router = APIRouter(prefix="/sessions", tags=["Multi-Device Sessions"])


@router.post("/login", response_model=APIResponse[SessionOut], status_code=status.HTTP_201_CREATED, summary="Login & Create Device Session")
async def login_session(
    payload: LoginRequest,
    request: Request,
    store: InMemoryDistributedSessionStore = Depends(get_session_store)
):
    ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("User-Agent", "Unknown-Browser")
    rec = store.create_session(
        user_id=payload.user_id,
        username=payload.username,
        device_name=payload.device_name,
        ip_address=ip,
        user_agent=ua
    )
    return APIResponse(
        message="Session created successfully",
        data=SessionOut(
            session_id=rec.session_id,
            user_id=rec.user_id,
            username=rec.username,
            device_name=rec.device_name,
            ip_address=rec.ip_address,
            created_at=rec.created_at,
            last_active=rec.last_active,
            expires_at=rec.expires_at,
            is_current_session=True
        )
    )


@router.get("/verify", response_model=APIResponse[SessionOut], summary="Verify Session Token and Slide TTL")
async def verify_session(
    x_session_id: str = Header(...),
    store: InMemoryDistributedSessionStore = Depends(get_session_store)
):
    rec = store.get_session_and_slide_ttl(x_session_id)
    if not rec:
        raise UnauthorizedSessionException()
    return APIResponse(
        data=SessionOut(
            session_id=rec.session_id,
            user_id=rec.user_id,
            username=rec.username,
            device_name=rec.device_name,
            ip_address=rec.ip_address,
            created_at=rec.created_at,
            last_active=rec.last_active,
            expires_at=rec.expires_at,
            is_current_session=True
        )
    )


@router.get("/active", response_model=APIResponse[ActiveSessionsList], summary="List User Active Sessions")
async def list_active(
    user_id: str,
    x_session_id: Optional[str] = Header(None),
    store: InMemoryDistributedSessionStore = Depends(get_session_store)
):
    records = store.list_user_sessions(user_id)
    items = [
        SessionOut(
            session_id=r.session_id,
            user_id=r.user_id,
            username=r.username,
            device_name=r.device_name,
            ip_address=r.ip_address,
            created_at=r.created_at,
            last_active=r.last_active,
            expires_at=r.expires_at,
            is_current_session=bool(x_session_id and x_session_id == r.session_id)
        )
        for r in records
    ]
    return APIResponse(
        data=ActiveSessionsList(
            total_active=len(items),
            max_devices_allowed=store.max_devices,
            sessions=items
        )
    )


@router.delete("/{session_id}", response_model=APIResponse[dict], summary="Revoke Specific Device Session")
async def revoke_device(
    session_id: str,
    store: InMemoryDistributedSessionStore = Depends(get_session_store)
):
    revoked = store.revoke_session(session_id)
    return APIResponse(
        message="Session revoked" if revoked else "Session not found",
        data={"revoked": revoked, "session_id": session_id}
    )


@router.post("/logout-everywhere", response_model=APIResponse[dict], summary="Logout Everywhere (Invalidate All Devices)")
async def logout_everywhere(
    user_id: str,
    store: InMemoryDistributedSessionStore = Depends(get_session_store)
):
    count = store.logout_everywhere(user_id)
    return APIResponse(
        message=f"Terminated all {count} active sessions for user",
        data={"sessions_terminated": count, "user_id": user_id}
    )


@router.post("/rotate", response_model=APIResponse[SessionOut], summary="Rotate Session ID (Prevent Fixation)")
async def rotate_session(
    x_session_id: str = Header(...),
    store: InMemoryDistributedSessionStore = Depends(get_session_store)
):
    rec = store.rotate_session_id(x_session_id)
    if not rec:
        raise UnauthorizedSessionException()

    return APIResponse(
        message="Session rotated with new cryptographically secure token",
        data=SessionOut(
            session_id=rec.session_id,
            user_id=rec.user_id,
            username=rec.username,
            device_name=rec.device_name,
            ip_address=rec.ip_address,
            created_at=rec.created_at,
            last_active=rec.last_active,
            expires_at=rec.expires_at,
            is_current_session=True
        )
    )
