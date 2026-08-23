"""
Hardened Production Endpoints (OWASP Top 10 Mitigated)
======================================================
Implements:
1. BOLA Mitigation via Tenant Authorization Context
2. Mass Assignment Mitigation via Strict Input DTO
3. SSRF Mitigation via DNS Resolution & Private CIDR Blocking
4. SQL Injection Mitigation via Parameterized Statements
5. Path Traversal Mitigation via Filename Sanitization & Magic Byte Validation
"""

from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.core.security import hash_password
from src.core.dependencies import get_current_user
from src.core.ssrf_validator import is_safe_external_url
from src.core.file_sanitizer import sanitize_filename, validate_file_content
from src.core.exceptions import (
    NotFoundException, ForbiddenException, SsrfBlockedException,
    FileUploadViolationException
)
from src.models.user import UserModel
from src.repositories.document_repo import DocumentRepository
from src.repositories.user_repo import UserRepository
from src.schemas.common import APIResponse
from src.schemas.user import UserCreateHardened, UserOut
from src.schemas.document import DocumentCreate, DocumentOut
from src.schemas.webhook import WebhookTriggerRequest, WebhookTriggerResponse

router = APIRouter(prefix="/hardened", tags=["Hardened Endpoints (OWASP Mitigated)"])


@router.post("/documents", response_model=APIResponse[DocumentOut], status_code=status.HTTP_201_CREATED, summary="Create Document")
async def create_document(
    payload: DocumentCreate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    repo = DocumentRepository(db)
    doc = await repo.create(
        owner_id=current_user.id,
        title=payload.title,
        content=payload.content,
        classification=payload.classification
    )
    return APIResponse(message="Document created", data=DocumentOut.model_validate(doc))


@router.get("/documents/{doc_id}", response_model=APIResponse[DocumentOut], summary="HARDENED: BOLA Mitigated")
async def hardened_get_document(
    doc_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    BOLA MITIGATION:
    Enforces that documents can only be retrieved if owned by the current authenticated caller.
    """
    repo = DocumentRepository(db)
    doc = await repo.get_by_owner_and_id(doc_id, current_user.id)
    if not doc:
        raise NotFoundException("Document", doc_id)
    return APIResponse(data=DocumentOut.model_validate(doc))


@router.post("/users", response_model=APIResponse[UserOut], status_code=status.HTTP_201_CREATED, summary="HARDENED: Mass Assignment Mitigated")
async def hardened_create_user(
    payload: UserCreateHardened,
    db: AsyncSession = Depends(get_db_session)
):
    """
    MASS ASSIGNMENT MITIGATION:
    Strict Pydantic DTO (extra="forbid"). Privilege flags (is_admin) are hardcoded to False.
    """
    repo = UserRepository(db)
    user = await repo.create(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role="user",
        is_admin=False
    )
    return APIResponse(message="User created with strict privilege controls", data=UserOut.model_validate(user))


@router.post("/webhooks/trigger", response_model=APIResponse[WebhookTriggerResponse], summary="HARDENED: SSRF Mitigated")
async def hardened_trigger_webhook(payload: WebhookTriggerRequest):
    """
    SSRF MITIGATION:
    Validates scheme, resolves DNS, blocks private/loopback/cloud metadata IP ranges.
    """
    is_safe, reason = is_safe_external_url(payload.webhook_url)
    if not is_safe:
        raise SsrfBlockedException(reason)

    return APIResponse(
        data=WebhookTriggerResponse(
            status="verified_and_dispatched",
            url=payload.webhook_url,
            details="Validated external IP address. Downstream dispatch permitted."
        )
    )


@router.get("/search", response_model=APIResponse[list], summary="HARDENED: SQLi Mitigated")
async def hardened_sql_search(
    query: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db_session)
):
    """
    SQLi MITIGATION:
    Uses parameterized queries with SQLAlchemy expression language.
    """
    repo = DocumentRepository(db)
    docs = await repo.hardened_parameterized_search(query)
    return APIResponse(data=[DocumentOut.model_validate(d) for d in docs])


@router.post("/upload", response_model=APIResponse[dict], summary="HARDENED: Path Traversal & Magic Byte Mitigated")
async def hardened_file_upload(file: UploadFile = File(...)):
    """
    FILE SECURITY MITIGATION:
    Sanitizes filename into a clean UUID, validates magic bytes against spoofing.
    """
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise FileUploadViolationException("File exceeds maximum allowed size of 5MB.")

    is_valid, reason = validate_file_content(content, file.filename, [".pdf", ".png", ".jpg", ".jpeg", ".txt"])
    if not is_valid:
        raise FileUploadViolationException(reason)

    safe_name = sanitize_filename(file.filename)
    safe_path = f"/uploads_sandbox/{safe_name}"

    return APIResponse(
        message="File verified and safely isolated",
        data={"safe_filename": safe_name, "stored_path": safe_path}
    )
