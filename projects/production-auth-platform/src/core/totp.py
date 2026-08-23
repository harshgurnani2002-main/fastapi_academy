"""
RFC 6238 Time-Based One-Time Password (TOTP) Implementation
===========================================================
Senior Design Note:
Implements standard RFC 6238 HMAC-SHA1 TOTP generation and validation without
external dependencies. Includes a 1-step window tolerance (±30 seconds) to handle
client/server clock drift gracefully.
"""

import base64
import hashlib
import hmac
import secrets
import struct
import time


def generate_totp_secret() -> str:
    """Generate a random 32-character Base32 secret key."""
    random_bytes = secrets.token_bytes(20)
    return base64.b32encode(random_bytes).decode("utf-8").replace("=", "")


def generate_totp_code(secret: str, time_step: int = 30, for_time: int = None) -> str:
    """Calculate 6-digit numeric TOTP code for a given timestamp."""
    if for_time is None:
        for_time = int(time.time())

    counter = for_time // time_step
    counter_bytes = struct.pack(">Q", counter)

    # Pad secret for Base32 decode
    pad = "=" * ((8 - len(secret) % 8) % 8)
    key = base64.b32decode(secret + pad, casefold=True)

    hmac_hash = hmac.new(key, counter_bytes, hashlib.sha1).digest()
    offset = hmac_hash[-1] & 0x0F
    code_int = struct.unpack(">I", hmac_hash[offset:offset + 4])[0] & 0x7FFFFFFF
    return f"{code_int % 1000000:06d}"


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verify code against current time with ± window step drift tolerance."""
    current_time = int(time.time())
    for w in range(-window, window + 1):
        test_time = current_time + (w * 30)
        expected = generate_totp_code(secret, for_time=test_time)
        if hmac.compare_digest(expected, code.strip()):
            return True
    return False
