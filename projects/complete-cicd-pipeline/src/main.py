from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CI/CD Pipeline Platform", version="19.0.0")

class TriggerRunRequest(BaseModel):
    branch: str = "main"
    commit_sha: str

@app.get("/api/v1/pipeline/status")
async def pipeline_status():
    return {
        "pipeline_stages": ["lint", "type_check", "unit_tests", "security_scan", "docker_build", "deploy"],
        "dora_metrics": {
            "deployment_frequency": "14 per week",
            "lead_time_for_changes": "18 minutes",
            "change_failure_rate": "0.8%",
            "mttr": "6 minutes"
        },
        "status": "PASSING"
    }

@app.get("/api/v1/pipeline/stages")
async def pipeline_stages():
    return {
        "stages": [
            {"name": "lint", "tool": "Ruff", "required": True},
            {"name": "type_check", "tool": "MyPy", "required": True},
            {"name": "tests", "tool": "Pytest with Coverage", "required": True},
            {"name": "security", "tool": "Trivy Vulnerability Scan", "required": True},
            {"name": "build", "tool": "Docker Buildx", "required": True},
            {"name": "deploy", "tool": "Kubernetes Rolling Update", "required": True}
        ]
    }

@app.post("/api/v1/pipeline/trigger-run")
async def trigger_run(payload: TriggerRunRequest):
    return {
        "run_id": "run-8f9a2b",
        "branch": payload.branch,
        "commit": payload.commit_sha,
        "status": "QUEUED"
    }
