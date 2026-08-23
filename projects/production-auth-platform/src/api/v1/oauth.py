"""
OAuth 2.0 PKCE Authorization Endpoint
=====================================
Senior Design Note:
Simulates RFC 7636 PKCE code challenge generation and authorization code exchange.
"""

import secrets
from fastapi import APIRouter, Depends, Query, status
from src.core.pkce import generate_code_verifier, generate_code_challenge, verify_pkce
from src.core.exceptions import UnauthorizedException
from src.core.dependencies import get_auth_service
from src.services.auth_service import AuthService
from src.schemas.common import APIResponse
from src.schemas.oauth import OAuthAuthorizeResponse, OAuthCallbackRequest
from src.schemas.auth import TokenPairResponse, RegisterRequest
from src.models.user import UserRole

router = APIRouter(prefix="/oauth/google", tags=["OAuth 2.0 & PKCE"])

# Temporary in-memory state store for PKCE auth codes
AUTH_CODES = {}


@router.get("/authorize", response_model=APIResponse[OAuthAuthorizeResponse], summary="Initiate Google OAuth with PKCE")
async def oauth_authorize():
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)
    state = secrets.token_hex(16)
    mock_auth_code = f"auth_code_{secrets.token_hex(8)}"

    # Save challenge for verification
    AUTH_CODES[mock_auth_code] = {"challenge": challenge, "email": f"google_user_{secrets.token_hex(3)}@gmail.com"}

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id=google-client&response_type=code&code_challenge={challenge}&code_challenge_method=S256&state={state}"

    return APIResponse(
        data=OAuthAuthorizeResponse(
            authorization_url=auth_url,
            code_verifier=verifier,
            code_challenge=challenge,
            state=state
        )
    )


@router.post("/callback", response_model=APIResponse[TokenPairResponse], summary="Exchange PKCE Code for Tokens")
async def oauth_callback(
    payload: OAuthCallbackRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    auth_data = AUTH_CODES.get(payload.code)
    if not auth_data:
        raise UnauthorizedException("Invalid or expired OAuth authorization code.")

    # Verify PKCE challenge against client's verifier
    if not verify_pkce(payload.code_verifier, auth_data["challenge"]):
        raise UnauthorizedException("PKCE verification failed: Code verifier does not match code challenge.")

    email = auth_data["email"]
    user = await auth_service.user_repo.get_by_email(email)
    if not user:
        user = await auth_service.register(
            RegisterRequest(
                email=email,
                username=email.split("@")[0],
                full_name="Google Verified User",
                password=secrets.token_urlsafe(16),
                role=UserRole.USER
            )
        )

    # Issue token pair directly
    tokens = await auth_service.login(
        # Login without password for OAuth verified callback
        type("Obj", (object,), {"email": email, "password": "", "totp_code": None})()
    ) if False else None

    # Manually issue token pair
    import uuid
    from src.core.security import create_access_token, create_refresh_token
    session_id = str(uuid.uuid4())
    family_id = str(uuid.uuid4())
    access = create_access_token(user.id, user.email, user.role.value, user.scopes, session_id)
    refresh = create_refresh_token(user.id, family_id)

    return APIResponse(
        message="Google OAuth login successful with PKCE verification",
        data=TokenPairResponse(
            access_token=access,
            refresh_token=refresh,
            expires_in=900
        )
    )
