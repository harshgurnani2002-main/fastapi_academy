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


class ConflictException(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status.HTTP_409_CONFLICT, "RESOURCE_CONFLICT", details)


class TokenTheftDetectedException(AppException):
    """Raised when an already rotated refresh token is replayed (family theft detection)."""
    def __init__(self):
        super().__init__(
            message="Security alert: Stolen or replayed refresh token detected. All sessions in this token family have been terminated.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="TOKEN_THEFT_DETECTED"
        )


class MfaRequiredException(AppException):
    def __init__(self):
        super().__init__(
            message="Multi-Factor Authentication (MFA) TOTP code required.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="MFA_REQUIRED"
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
