from fastapi import FastAPI, Request

app = FastAPI(title="Production Nginx Setup", version="20.0.0")

@app.get("/api/v1/proxy/verify")
async def verify_proxy(request: Request):
    return {
        "forwarded_for": request.headers.get("X-Forwarded-For", "direct"),
        "forwarded_proto": request.headers.get("X-Forwarded-Proto", "http"),
        "host": request.headers.get("Host", "localhost"),
        "tls_terminated": request.headers.get("X-Forwarded-Proto") == "https"
    }

@app.get("/api/v1/proxy/security-headers")
async def get_security_headers():
    return {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block"
    }

@app.get("/api/v1/proxy/ssl-info")
async def ssl_info():
    return {
        "ssl_protocols": ["TLSv1.2", "TLSv1.3"],
        "ssl_ciphers": "HIGH:!aNULL:!MD5",
        "http2_enabled": True
    }
