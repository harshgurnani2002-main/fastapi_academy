import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_mass_assignment_mitigation(client: AsyncClient):
    # 1. Attacker calls VULNERABLE endpoint injecting {"is_admin": true} -> EXPLOIT SUCCEEDS
    vuln_res = await client.post("/api/v1/vulnerable/users", json={
        "email": "attacker@evil.com",
        "username": "attacker",
        "password": "password123",
        "is_admin": True,
        "role": "super_admin"
    })
    assert vuln_res.status_code == 201
    assert vuln_res.json()["data"]["is_admin"] is True

    # 2. Attacker calls HARDENED endpoint injecting {"is_admin": true} -> 422 Unprocessable Entity (extra fields forbidden)
    hardened_res = await client.post("/api/v1/hardened/users", json={
        "email": "hacker@evil.com",
        "username": "hacker",
        "password": "password123",
        "is_admin": True
    })
    assert hardened_res.status_code == 422
