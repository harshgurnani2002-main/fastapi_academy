from fastapi import APIRouter, Depends
from src.core.dependencies import get_current_user, get_db_session
from src.core.totp import generate_totp_secret, verify_totp_code
from src.core.exceptions import UnauthorizedException
from src.models.user import UserModel
from src.schemas.common import APIResponse
from src.schemas.mfa import MfaSetupResponse, MfaVerifyRequest
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/mfa", tags=["Multi-Factor Authentication (TOTP)"])


@router.post("/setup", response_model=APIResponse[MfaSetupResponse], summary="Generate TOTP MFA Secret")
async def setup_mfa(
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    secret = generate_totp_secret()
    current_user.mfa_secret = secret
    await db.flush()

    otp_url = f"otpauth://totp/FastAPIAuth:{current_user.email}?secret={secret}&issuer=FastAPIAuth"
    return APIResponse(
        message="MFA Secret generated. Scan QR code or enter secret into Authenticator App.",
        data=MfaSetupResponse(
            secret=secret,
            otpauth_url=otp_url,
            qr_code_hint=f"Enter {secret} into Google Authenticator or 1Password"
        )
    )


@router.post("/verify", response_model=APIResponse[dict], summary="Verify & Activate MFA")
async def verify_and_enable_mfa(
    payload: MfaVerifyRequest,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    if not current_user.mfa_secret:
        raise UnauthorizedException("Please run /mfa/setup before verifying.")

    if not verify_totp_code(current_user.mfa_secret, payload.code):
        raise UnauthorizedException("Invalid TOTP code. Please try again.")

    current_user.mfa_enabled = True
    await db.flush()
    return APIResponse(message="MFA activated successfully on account", data={"mfa_enabled": True})
