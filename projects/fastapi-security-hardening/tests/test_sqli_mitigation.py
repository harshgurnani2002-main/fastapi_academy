import pytest
from httpx import AsyncClient
from src.core.security import create_access_token


@pytest.mark.asyncio
async def test_sql_injection_mitigation(client: AsyncClient):
    # Setup document
    token = create_access_token(user_id=1, email="admin@corp.com", role="admin", is_admin=True)
    await client.post("/api/v1/hardened/users", json={"email": "admin@corp.com", "username": "admin", "password": "password123"})
    await client.post("/api/v1/hardened/documents", json={
        "title": "Corporate Financials 2026",
        "content": "Secret Ledger",
        "classification": "confidential"
    }, headers={"Authorization": f"Bearer {token}"})

    # 1. SQL Injection Payload: ' OR '1'='1
    sqli_payload = "' OR '1'='1"

    # Hardened search treats query as literal string, returning 0 matches safely
    hardened_search = await client.get(f"/api/v1/hardened/search?query={sqli_payload}")
    assert hardened_search.status_code == 200
    assert len(hardened_search.json()["data"]) == 0
