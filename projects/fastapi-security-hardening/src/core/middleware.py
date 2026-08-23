"""
Comprehensive Security Headers & Rate Limit Middleware
======================================================
Senior Design Note:
Injects OWASP-recommended HTTP security headers:
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY (prevents clickjacking)
- Content-Security-Policy
- Referrer-Policy: strict-origin-when-cross-origin
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from src.core.rate_limiter import rate_limiter
import uuid


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.state.correlation_id = cid

        response = await call_next(request)

        # Injected Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Correlation-ID"] = cid

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Check client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        
        # Enforce rate limit on hardened endpoints
        if "/hardened/" in request.url.path:
            if not rate_limiter.is_allowed(client_ip, max_requests=10, window_seconds=60):
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many requests. Please slow down and try again later.",
                            "correlation_id": getattr(request.state, "correlation_id", "unknown")
                        }
                    }
                )

        return await call_next(request)
