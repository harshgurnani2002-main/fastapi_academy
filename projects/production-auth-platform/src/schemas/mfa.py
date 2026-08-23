from pydantic import BaseModel, Field


class MfaSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    qr_code_hint: str


class MfaVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
