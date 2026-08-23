import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_file_upload_sanitization_and_magic_byte_validation(client: AsyncClient):
    # 1. Path traversal filename attempt (../../cron.d/exploit.txt) with valid text content
    traversal_file = ("../../cron.d/exploit.txt", b"echo pwned", "text/plain")
    res = await client.post("/api/v1/hardened/upload", files={"file": traversal_file})
    assert res.status_code == 200
    safe_name = res.json()["data"]["safe_filename"]
    # Verify path traversal sequences stripped and UUID filename generated
    assert "../" not in safe_name
    assert safe_name.endswith(".txt")

    # 2. Magic byte spoofing attempt (.pdf extension with fake HTML/executable payload)
    fake_pdf = ("invoice.pdf", b"<html>Fake PDF payload</html>", "application/pdf")
    spoof_res = await client.post("/api/v1/hardened/upload", files={"file": fake_pdf})
    assert spoof_res.status_code == 400
    assert spoof_res.json()["error"]["code"] == "FILE_SECURITY_VIOLATION"
