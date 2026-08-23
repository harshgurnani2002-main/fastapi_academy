import pytest
from httpx import AsyncClient
from src.core.totp import generate_totp_code


@pytest.mark.asyncio
async def test_totp_mfa_setup_and_login_enforcement(client: AsyncClient):
    # 1. Register & Login
    await client.post("/api/v1/auth/register", json={
        "email": "mfa_user@company.com",
        "username": "mfa_user",
        "full_name": "MFA User",
        "password": "password123",
        "role": "user"
    })
    login1 = await client.post("/api/v1/auth/login", json={"email": "mfa_user@company.com", "password": "password123"})
    token = login1.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup MFA
    setup_res = await client.post("/api/v1/mfa/setup", headers=headers)
    assert setup_res.status_code == 200
    secret = setup_res.json()["data"]["secret"]

    # 3. Verify & Enable MFA with calculated TOTP code
    valid_code = generate_totp_code(secret)
    verify_res = await client.post("/api/v1/mfa/verify", json={"code": valid_code}, headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["data"]["mfa_enabled"] is True

    # 4. Login without TOTP code now fails with 403 MFA_REQUIRED
    login_no_mfa = await client.post("/api/v1/auth/login", json={"email": "mfa_user@company.com", "password": "password123"})
    assert login_no_mfa.status_code == 403
    assert login_no_mfa.json()["error"]["code"] == "MFA_REQUIRED"

    # 5. Login with valid TOTP code succeeds
    login_with_mfa = await client.post("/api/v1/auth/login", json={
        "email": "mfa_user@company.com",
        "password": "password123",
        "totp_code": generate_totp_code(secret)
    })
    assert login_with_mfa.status_code == 200
