from pydantic import BaseModel, Field


class WebhookTriggerRequest(BaseModel):
    webhook_url: str = Field(..., description="Destination URL to dispatch telemetry notification")


class WebhookTriggerResponse(BaseModel):
    status: str
    url: str
    details: str
