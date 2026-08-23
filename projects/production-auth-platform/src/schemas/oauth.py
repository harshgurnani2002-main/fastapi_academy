from pydantic import BaseModel, Field


class OAuthAuthorizeResponse(BaseModel):
    authorization_url: str
    code_verifier: str
    code_challenge: str
    state: str


class OAuthCallbackRequest(BaseModel):
    code: str
    code_verifier: str
    state: str
