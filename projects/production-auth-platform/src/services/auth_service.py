"""
Authentication Workflow & Token Rotation Service
================================================
Senior Design Note:
Detects refresh token theft by checking `is_used` on the stored token record.
If a used token is presented, `TokenTheftDetectedException` is raised and all tokens
in that token family are revoked.
"""

import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.config import get_settings
from src.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_jwt
)
from src.core.totp import verify_totp_code
from src.core.redis import AsyncRedisStore
from src.core.exceptions import (
    UnauthorizedException, ConflictException, TokenTheftDetectedException,
    MfaRequiredException
)
from src.models.user import UserModel
from src.models.refresh_token import RefreshTokenModel
from src.repositories.user_repo import UserRepository
from src.repositories.token_repo import TokenRepository
from src.schemas.auth import RegisterRequest, LoginRequest, TokenPairResponse

settings = get_settings()


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, session: AsyncSession, redis: AsyncRedisStore):
        self.session = session
        self.redis = redis
        self.user_repo = UserRepository(session)
        self.token_repo = TokenRepository(session)

    async def register(self, payload: RegisterRequest) -> UserModel:
        if await self.user_repo.get_by_email(payload.email):
            raise ConflictException(f"Email '{payload.email}' is already registered.")
        if await self.user_repo.get_by_username(payload.username):
            raise ConflictException(f"Username '{payload.username}' is taken.")

        default_scopes = ["profile:read", "profile:write"]
        if payload.role.value in ["super_admin", "org_admin"]:
            default_scopes.extend(["admin:all", "billing:write"])

        return await self.user_repo.create(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=payload.role,
            scopes=default_scopes,
            is_active=True,
            is_verified=False,
            mfa_enabled=False
        )

    async def login(self, payload: LoginRequest) -> TokenPairResponse:
        user = await self.user_repo.get_by_email(payload.email)
        if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password.")

        if not user.is_active:
            raise UnauthorizedException("User account is disabled.")

        # Check MFA if enabled on user account
        if user.mfa_enabled:
            if not payload.totp_code or not user.mfa_secret or not verify_totp_code(user.mfa_secret, payload.totp_code):
                raise MfaRequiredException()

        session_id = str(uuid.uuid4())
        family_id = str(uuid.uuid4())

        access_token = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role.value,
            scopes=user.scopes,
            session_id=session_id,
            mfa_verified=True
        )
        refresh_token = create_refresh_token(user.id, family_id)

        # Store refresh token record
        now = datetime.now(timezone.utc)
        await self.token_repo.create(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            family_id=family_id,
            is_used=False,
            is_revoked=False,
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )

        # Register session in Redis
        await self.redis.set(f"session:{session_id}", str(user.id), ex=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
        await self.redis.sadd(f"user_sessions:{user.id}", session_id)

        return TokenPairResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def rotate_refresh_token(self, old_refresh_token: str) -> TokenPairResponse:
        """
        Refresh Token Rotation (RTR) with Token Theft Invalidation.
        """
        payload = decode_jwt(old_refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid or expired refresh token.")

        token_h = hash_token(old_refresh_token)
        record = await self.token_repo.get_by_hash(token_h)

        if not record or record.is_revoked:
            raise UnauthorizedException("Refresh token is revoked or invalid.")

        # TOKEN THEFT DETECTION: If already marked as used, attack detected!
        if record.is_used:
            await self.token_repo.revoke_entire_family(record.family_id)
            # Invalidate all user sessions in Redis
            sessions = await self.redis.smembers(f"user_sessions:{record.user_id}")
            for s in sessions:
                await self.redis.delete(f"session:{s}")
            raise TokenTheftDetectedException()

        # Mark current token as used
        record.is_used = True
        await self.session.flush()

        user = await self.user_repo.get_by_id(record.user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive.")

        # Issue new token pair continuing the same family_id
        session_id = str(uuid.uuid4())
        new_access = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role.value,
            scopes=user.scopes,
            session_id=session_id,
            mfa_verified=True
        )
        new_refresh = create_refresh_token(user.id, record.family_id)

        now = datetime.now(timezone.utc)
        await self.token_repo.create(
            user_id=user.id,
            token_hash=hash_token(new_refresh),
            family_id=record.family_id,
            is_used=False,
            is_revoked=False,
            expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )

        await self.redis.set(f"session:{session_id}", str(user.id), ex=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
        await self.redis.sadd(f"user_sessions:{user.id}", session_id)

        return TokenPairResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    async def logout(self, session_id: str, access_token: str) -> None:
        """Blacklist active token and invalidate session in Redis."""
        payload = decode_jwt(access_token)
        if payload and "jti" in payload:
            await self.redis.set(f"blacklist:{payload['jti']}", "1", ex=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        await self.redis.delete(f"session:{session_id}")

    async def logout_all(self, user_id: int) -> None:
        """Global logout: invalidates all refresh tokens and active sessions."""
        await self.token_repo.revoke_all_user_tokens(user_id)
        sessions = await self.redis.smembers(f"user_sessions:{user_id}")
        for s in sessions:
            await self.redis.delete(f"session:{s}")
        await self.redis.delete(f"user_sessions:{user_id}")
