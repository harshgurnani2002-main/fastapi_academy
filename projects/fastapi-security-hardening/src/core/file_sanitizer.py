"""
File Upload Sanitization & Path Traversal Mitigator
===================================================
Senior Design Note:
Mitigates Path Traversal (CWE-22) and Arbitrary File Upload (CWE-434):
1. Discards client-provided directory paths.
2. Extracts safe file extensions.
3. Validates file header magic bytes against spoofed MIME types.
4. Generates random UUID storage keys.
"""

import os
import re
import uuid
from typing import Tuple, List

MAGIC_BYTES = {
    ".pdf": [b"%PDF-"],
    ".png": [bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
    ".jpg": [bytes([0xFF, 0xD8, 0xFF])],
    ".jpeg": [bytes([0xFF, 0xD8, 0xFF])],
    ".txt": []  # Plain text permitted
}


def sanitize_filename(client_filename: str) -> str:
    """Strip path traversal sequences (../, ../../, null bytes) and return safe UUID filename."""
    base_name = os.path.basename(client_filename)
    clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", base_name)
    ext = os.path.splitext(clean_name)[1].lower()
    return f"{uuid.uuid4().hex}{ext}"


def validate_file_content(content: bytes, filename: str, allowed_extensions: List[str]) -> Tuple[bool, str]:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_extensions:
        return False, f"File extension '{ext}' is not permitted. Allowed: {allowed_extensions}"

    expected_magic = MAGIC_BYTES.get(ext)
    if expected_magic:
        valid_magic = any(content.startswith(magic) for magic in expected_magic)
        if not valid_magic:
            return False, f"File content header does not match declared extension '{ext}' (Magic byte spoofing detected)."

    return True, "File verified safe."
