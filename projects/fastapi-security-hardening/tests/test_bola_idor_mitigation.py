import pytest
from httpx import AsyncClient
from src.core.security import create_access_token


@pytest.mark.asyncio
async def test_bola_mitigation(client: AsyncClient):
    # 1. Create two users
    await client.post("/api/v1/hardened/users", json={"email": "alice@corp.com", "username": "alice", "password": "password123"})
    await client.post("/api/v1/hardened/users", json={"email": "bob@corp.com", "username": "bob", "password": "password123"})

    alice_token = create_access_token(user_id=1, email="alice@corp.com", role="user", is_admin=False)
    bob_token = create_access_token(user_id=2, email="bob@corp.com", role="user", is_admin=False)

    # 2. Alice creates a confidential document (ID = 1)
    doc_res = await client.post("/api/v1/hardened/documents", json={
        "title": "Alice Secret Project Blueprint",
        "content": "Confidential IP Data",
        "classification": "secret"
    }, headers={"Authorization": f"Bearer {alice_token}"})
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["data"]["id"]

    # 3. VULNERABLE ENDPOINT: Bob accesses Alice's document without authorization -> EXPLOIT SUCCEEDS
    vuln_res = await client.get(f"/api/v1/vulnerable/documents/{doc_id}")
    assert vuln_res.status_code == 200
    assert vuln_res.json()["data"]["content"] == "Confidential IP Data"

    # 4. HARDENED ENDPOINT: Bob tries to access Alice's document -> 404 Not Found (BOLA MITIGATED)
    hardened_res = await client.get(f"/api/v1/hardened/documents/{doc_id}", headers={"Authorization": f"Bearer {bob_token}"})
    assert hardened_res.status_code == 404
