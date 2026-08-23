"""
RFC 7636 Proof Key for Code Exchange (PKCE)
===========================================
Protects OAuth 2.0 authorization code flows against interception attacks in public clients.
"""

import base64
import hashlib
import secrets


def generate_code_verifier() -> str:
    """Generate cryptographically random 64-char URL-safe string."""
    return secrets.token_urlsafe(48)


def generate_code_challenge(verifier: str) -> str:
    """Compute S256 code challenge from verifier."""
    sha = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(sha).decode("ascii").rstrip("=")


def verify_pkce(verifier: str, expected_challenge: str) -> bool:
    calculated = generate_code_challenge(verifier)
    return secrets.compare_digest(calculated, expected_challenge)
