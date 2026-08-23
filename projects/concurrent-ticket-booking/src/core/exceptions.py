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
            message=f"{resource} '{identifier}' does not exist.",
            status_code=status.HTTP_404_NOT_FOUND,
            code=f"{resource.upper()}_NOT_FOUND",
            details={"resource": resource, "identifier": str(identifier)}
        )


class SoldOutException(AppException):
    """Raised when an event or inventory category has zero remaining available tickets."""
    def __init__(self, event_id: int):
        super().__init__(
            message=f"Event {event_id} is completely sold out. No tickets remaining.",
            status_code=status.HTTP_409_CONFLICT,
            code="EVENT_SOLD_OUT",
            details={"event_id": event_id}
        )


class SeatUnavailableException(AppException):
    """Raised when a specific seat is already booked or held by another user."""
    def __init__(self, seat_number: str, current_status: str):
        super().__init__(
            message=f"Seat '{seat_number}' is unavailable (currently {current_status}).",
            status_code=status.HTTP_409_CONFLICT,
            code="SEAT_UNAVAILABLE",
            details={"seat_number": seat_number, "status": current_status}
        )


class IdempotencyConflictException(AppException):
    """Raised when an identical idempotency key is already actively being processed."""
    def __init__(self, key: str):
        super().__init__(
            message=f"Request with Idempotency-Key '{key}' is currently being processed.",
            status_code=status.HTTP_409_CONFLICT,
            code="IDEMPOTENCY_IN_PROGRESS",
            details={"idempotency_key": key}
        )


class ExpiredHoldException(AppException):
    """Raised when trying to confirm a ticket hold that has already expired."""
    def __init__(self, seat_number: str):
        super().__init__(
            message=f"Hold on seat '{seat_number}' has expired and returned to the available inventory.",
            status_code=status.HTTP_410_GONE,
            code="HOLD_EXPIRED",
            details={"seat_number": seat_number}
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
