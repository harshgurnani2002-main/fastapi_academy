from fastapi import FastAPI
import os

app = FastAPI(title="FastAPI Kubernetes Deployment", version="21.0.0")

@app.get("/health/live")
async def liveness():
    return {"status": "LIVE", "pod_name": os.getenv("POD_NAME", "fastapi-api-7b8f9c-1")}

@app.get("/health/ready")
async def readiness():
    return {"status": "READY", "traffic_enabled": True}

@app.get("/api/v1/k8s/deployment")
async def get_k8s_meta():
    return {
        "replicas": 3,
        "rolling_update": {"maxSurge": 1, "maxUnavailable": 0},
        "hpa": {"minReplicas": 3, "maxReplicas": 20, "cpu_target": 70}
    }

@app.get("/api/v1/k8s/ingress")
async def get_ingress_meta():
    return {
        "ingress_class": "nginx",
        "tls_secret": "enterprise-wildcard-cert",
        "hosts": ["api.enterprise.io"]
    }
