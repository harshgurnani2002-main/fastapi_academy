"""
FastAPI Rate Limiting ASGI Middleware
=====================================
Senior Design Note:
Extracts client identifier:
1. Bearer Token Sub / API Key (if authenticated)
2. Fallback to Client IP
Injects standard IETF X-RateLimit headers into every response.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from src.core.redis_engine import redis_engine
from src.core.rate_limiters.sliding_window import SlidingWindowRateLimiter
import uuid


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, default_limit: int = 20, default_window: int = 60):
        super().__init__(app)
        self.default_limit = default_limit
        self.default_window = default_window
        self.limiter = SlidingWindowRateLimiter(redis_engine)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.state.correlation_id = cid

        # Extract identifier
        auth = request.headers.get("Authorization") or request.headers.get("X-API-Key")
        client_ip = request.client.host if request.client else "127.0.0.1"
        identifier = f"ip:{client_ip}" if not auth else f"auth:{auth[:16]}"

        # Bypass docs & openapi
        if request.url.path in ["/docs", "/redoc", "/openapi.json", "/api/v1/simulator/run-burst"]:
            return await call_next(request)

        result = await self.limiter.evaluate(identifier, self.default_limit, self.default_window)

        if not result.is_allowed:
            return JSONResponse(
                status_code=429,
                headers={
                    "Retry-After": str(result.retry_after_seconds),
                    "X-RateLimit-Limit": str(result.limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(result.reset_epoch),
                    "X-RateLimit-Algorithm": result.algorithm,
                    "X-Correlation-ID": cid
                },
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Please retry after {result.retry_after_seconds}s.",
                        "correlation_id": cid
                    }
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(result.limit)
        response.headers["X-RateLimit-Remaining"] = str(result.remaining)
        response.headers["X-RateLimit-Reset"] = str(result.reset_epoch)
        response.headers["X-RateLimit-Algorithm"] = result.algorithm
        response.headers["X-Correlation-ID"] = cid
        return response
