from typing import Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
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


class RateLimitExceededException(AppException):
    def __init__(self, retry_after_seconds: int, limit: int, reset_epoch: int):
        super().__init__(
            message=f"Rate limit exceeded. Quota resets in {retry_after_seconds}s.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="RATE_LIMIT_EXCEEDED",
            details={
                "retry_after_seconds": retry_after_seconds,
                "limit": limit,
                "reset_epoch": reset_epoch
            }
        )
        self.retry_after_seconds = retry_after_seconds
        self.limit = limit
        self.reset_epoch = reset_epoch


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    cid = getattr(request.state, "correlation_id", "unknown")
    headers = {}
    if isinstance(exc, RateLimitExceededException):
        headers["Retry-After"] = str(exc.retry_after_seconds)
        headers["X-RateLimit-Limit"] = str(exc.limit)
        headers["X-RateLimit-Remaining"] = "0"
        headers["X-RateLimit-Reset"] = str(exc.reset_epoch)

    return JSONResponse(
        status_code=exc.status_code,
        headers=headers,
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
