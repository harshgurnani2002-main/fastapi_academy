"""
Vulnerable Endpoints Lab (For Attack Demonstrations)
===================================================
Demonstrates OWASP Top 10 API vulnerabilities:
1. API1:2023 - Broken Object Level Authorization (BOLA)
2. API3:2023 - Broken Object Property Level Auth (Mass Assignment)
3. API7:2023 - Server-Side Request Forgery (SSRF)
4. SQL Injection (Raw string formatting)
5. Path Traversal File Upload
"""

import os
from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session
from src.core.security import hash_password
from src.core.exceptions import NotFoundException
from src.models.user import UserModel
from src.models.document import DocumentModel
from src.repositories.document_repo import DocumentRepository
from src.repositories.user_repo import UserRepository
from src.schemas.common import APIResponse
from src.schemas.user import UserCreateVulnerable, UserOut
from src.schemas.document import DocumentOut
from src.schemas.webhook import WebhookTriggerRequest, WebhookTriggerResponse

router = APIRouter(prefix="/vulnerable", tags=["Vulnerable Endpoints (OWASP Demonstrator)"])


@router.get("/documents/{doc_id}", response_model=APIResponse[DocumentOut], summary="VULNERABLE: BOLA / IDOR")
async def vulnerable_get_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """
    VULNERABILITY: Broken Object Level Authorization.
    Fetches any document by ID without verifying if the caller is the legitimate owner.
    """
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(doc_id)
    if not doc:
        raise NotFoundException("Document", doc_id)
    return APIResponse(data=DocumentOut.model_validate(doc))


@router.post("/users", response_model=APIResponse[UserOut], status_code=status.HTTP_201_CREATED, summary="VULNERABLE: Mass Assignment")
async def vulnerable_create_user(
    payload: UserCreateVulnerable,
    db: AsyncSession = Depends(get_db_session)
):
    """
    VULNERABILITY: Mass Assignment.
    Directly assigns client-provided fields, allowing caller to inject {"is_admin": true}.
    """
    repo = UserRepository(db)
    user = await repo.create(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=payload.role or "user",
        is_admin=payload.is_admin or False
    )
    return APIResponse(message="User created (Vulnerable to mass assignment)", data=UserOut.model_validate(user))


@router.post("/webhooks/trigger", response_model=APIResponse[WebhookTriggerResponse], summary="VULNERABLE: SSRF")
async def vulnerable_trigger_webhook(payload: WebhookTriggerRequest):
    """
    VULNERABILITY: Server-Side Request Forgery (SSRF).
    Fetches arbitrary user-supplied URL directly without IP or metadata checking.
    """
    # Simulate making downstream request to user URL
    return APIResponse(
        data=WebhookTriggerResponse(
            status="dispatched",
            url=payload.webhook_url,
            details=f"Dispatched request to {payload.webhook_url} without SSRF verification (DANGEROUS: allows AWS metadata access)"
        )
    )


@router.get("/search", response_model=APIResponse[list], summary="VULNERABLE: SQL Injection")
async def vulnerable_sql_search(
    query: str = Query(...),
    db: AsyncSession = Depends(get_db_session)
):
    """
    VULNERABILITY: Raw string interpolation SQL injection.
    """
    repo = DocumentRepository(db)
    docs = await repo.vulnerable_raw_search(query)
    return APIResponse(data=[DocumentOut.model_validate(d) for d in docs])


@router.post("/upload", response_model=APIResponse[dict], summary="VULNERABLE: Path Traversal Upload")
async def vulnerable_file_upload(file: UploadFile = File(...)):
    """
    VULNERABILITY: Path Traversal & Unrestricted File Upload.
    Uses client filename directly (e.g. ../../cron.d/malicious.sh).
    """
    upload_path = os.path.join("./uploads_sandbox", file.filename)
    return APIResponse(
        message="Uploaded insecurely",
        data={"stored_path": upload_path, "warning": "Vulnerable to directory traversal"}
    )
