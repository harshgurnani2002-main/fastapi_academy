import base64
import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional
from src.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a password using salted PBKDF2 HMAC SHA-256."""
    salt = "fastapi_salt_v2_"
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return base64.b64encode(key).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hashed string using constant-time comparison."""
    calculated = hash_password(plain_password)
    return hmac.compare_digest(calculated, hashed_password)


def create_jwt_token(payload: Dict[str, Any], expires_in_seconds: int) -> str:
    """Generate a standard HMAC-SHA256 signed JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    token_payload = {
        **payload,
        "iat": now,
        "exp": now + expires_in_seconds,
    }

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(token_payload).encode("utf-8")).decode("utf-8").rstrip("=")
    
    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    
    return f"{signing_input}.{sig_b64}"


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token string. Returns payload or None if invalid/expired."""
    parts = token.split(".")
    if len(parts) != 3:
        return None
    
    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}"
    
    expected_sig = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256
    ).digest()
    
    # Pad base64 signature
    padding = "=" * ((4 - len(sig_b64) % 4) % 4)
    try:
        actual_sig = base64.urlsafe_b64decode(sig_b64 + padding)
    except Exception:
        return None

    if not hmac.compare_digest(expected_sig, actual_sig):
        return None

    payload_pad = "=" * ((4 - len(payload_b64) % 4) % 4)
    try:
        payload_data = json.loads(base64.urlsafe_b64decode(payload_b64 + payload_pad).decode("utf-8"))
    except Exception:
        return None

    if "exp" in payload_data and int(time.time()) > payload_data["exp"]:
        return None

    return payload_data
