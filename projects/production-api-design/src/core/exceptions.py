from typing import Any, Optional, List, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []


class ResourceNotFoundException(APIError):
    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource_type} '{resource_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details=[{"resource": resource_type, "id": str(resource_id)}]
        )


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    cid = getattr(request.state, "correlation_id", "req-unknown")
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
    cid = getattr(request.state, "correlation_id", "req-unknown")
    errs = [{"field": ".".join(str(l) for l in e.get("loc", [])[1:]), "issue": e.get("msg")} for e in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_FAILED",
                "message": "Input validation error",
                "details": errs,
                "correlation_id": cid
            }
        }
    )
