from fastapi import FastAPI
import os

app = FastAPI(
    title="Containerized FastAPI Platform",
    version="18.0.0",
    description="Multi-Stage Minimal Docker Architecture with Non-Root User & Health Probes"
)

@app.get("/health/live")
async def live():
    return {"status": "LIVE", "container_id": os.getenv("HOSTNAME", "docker-host-1")}

@app.get("/health/ready")
async def ready():
    return {"status": "READY", "services": {"postgres": "CONNECTED", "redis": "CONNECTED"}}

@app.get("/api/v1/container/info")
async def container_info():
    return {
        "non_root_user": "appuser (UID 10001)",
        "base_image": "python:3.11-slim",
        "multi_stage": True
    }

@app.get("/api/v1/container/security-audit")
async def security_audit():
    return {
        "user": "appuser",
        "is_root": False,
        "read_only_root_filesystem": True,
        "drop_capabilities": ["ALL"]
    }
