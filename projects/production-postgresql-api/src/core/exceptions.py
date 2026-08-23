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


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} identified by '{identifier}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            code=f"{resource.upper()}_NOT_FOUND",
            details={"resource": resource, "identifier": str(identifier)}
        )


class ConflictException(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            code="RESOURCE_CONFLICT",
            details=details
        )


class ConcurrencyConflictException(AppException):
    """Raised when an optimistic lock version mismatch is detected."""
    def __init__(self, resource: str, identifier: Any, expected_version: int):
        super().__init__(
            message=f"Concurrency conflict: {resource} '{identifier}' was modified by another transaction. Expected version {expected_version}.",
            status_code=status.HTTP_409_CONFLICT,
            code="OPTIMISTIC_LOCK_CONFLICT",
            details={"resource": resource, "identifier": str(identifier), "expected_version": expected_version}
        )


class ValidationException(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            details=details
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
