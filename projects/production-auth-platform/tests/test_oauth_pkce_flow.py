import pytest
from httpx import AsyncClient
from src.core.pkce import generate_code_verifier, generate_code_challenge


@pytest.mark.asyncio
async def test_oauth_pkce_authorization_and_exchange(client: AsyncClient):
    # 1. Start OAuth Flow
    auth_init = await client.get("/api/v1/oauth/google/authorize")
    assert auth_init.status_code == 200
    data = auth_init.json()["data"]
    code_verifier = data["code_verifier"]
    state = data["state"]

    # Extract mock auth code from URL query params in simulation
    url = data["authorization_url"]
    assert "code_challenge=" in url

    # Callback with valid PKCE verifier
    from src.api.v1.oauth import AUTH_CODES
    mock_code = list(AUTH_CODES.keys())[-1]

    cb_res = await client.post("/api/v1/oauth/google/callback", json={
        "code": mock_code,
        "code_verifier": code_verifier,
        "state": state
    })
    assert cb_res.status_code == 200
    tokens = cb_res.json()["data"]
    assert "access_token" in tokens
    assert "refresh_token" in tokens
