import base64
import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional
from src.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    salt = "sec_salt_v6_"
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return base64.b64encode(key).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    calc = hash_password(plain_password)
    return hmac.compare_digest(calc, hashed_password)


def create_access_token(user_id: int, email: str, role: str, is_admin: bool) -> str:
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "is_admin": is_admin,
        "iat": now,
        "exp": now + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    }
    header = {"alg": "HS256", "typ": "JWT"}
    h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode("utf-8")).decode("utf-8").rstrip("=")
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")
    
    signing_input = f"{h_b64}.{p_b64}"
    sig = hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode("utf-8").rstrip("=")
    return f"{signing_input}.{sig_b64}"


def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
    parts = token.split(".")
    if len(parts) != 3:
        return None
    h_b64, p_b64, sig_b64 = parts
    signing_input = f"{h_b64}.{p_b64}"
    expected = hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), signing_input.encode("utf-8"), hashlib.sha256).digest()
    
    pad = "=" * ((4 - len(sig_b64) % 4) % 4)
    try:
        actual = base64.urlsafe_b64decode(sig_b64 + pad)
    except Exception:
        return None

    if not hmac.compare_digest(expected, actual):
        return None

    p_pad = "=" * ((4 - len(p_b64) % 4) % 4)
    try:
        data = json.loads(base64.urlsafe_b64decode(p_b64 + p_pad).decode("utf-8"))
    except Exception:
        return None

    if "exp" in data and int(time.time()) > data["exp"]:
        return None

    return data
