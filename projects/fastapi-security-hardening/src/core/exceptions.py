from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)


class AppException(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "INTERNAL_ERROR",
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED")


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden: Insufficient permissions"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "FORBIDDEN")


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} '{identifier}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            code=f"{resource.upper()}_NOT_FOUND"
        )


class SsrfBlockedException(AppException):
    def __init__(self, reason: str):
        super().__init__(
            message=f"SSRF Security Violation: {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="SSRF_BLOCKED",
            details={"security_violation": "SSRF_DETECTED"}
        )


class FileUploadViolationException(AppException):
    def __init__(self, reason: str):
        super().__init__(
            message=f"File Security Violation: {reason}",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="FILE_SECURITY_VIOLATION"
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    cid = getattr(request.state, "correlation_id", "unknown")
    logger.warning(f"AppException: [{exc.code}] {exc.message} [CID: {cid}]")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "correlation_id": cid
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    cid = getattr(request.state, "correlation_id", "unknown")
    errors = [{"location": " -> ".join(str(l) for l in err.get("loc", [])), "message": err.get("msg")} for err in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation error",
                "details": errors,
                "correlation_id": cid
            }
        }
    )
