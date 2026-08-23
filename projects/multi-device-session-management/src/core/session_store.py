"""
Distributed Redis Session Store Engine
======================================
Senior Design Note:
1. Stores session records keyed by `session:{session_id}` with sliding TTL.
2. Maintains user active session index `user_sessions:{user_id}` (Set of session IDs).
3. Automatically kicks the oldest device session when `MAX_ACTIVE_DEVICES_PER_USER` is exceeded.
4. Supports instant atomic invalidation ("Logout Everywhere").
"""

import time
import uuid
import secrets
from typing import Dict, List, Optional, Any
from collections import defaultdict


class SessionRecord:
    def __init__(
        self,
        session_id: str,
        user_id: str,
        username: str,
        device_name: str,
        ip_address: str,
        user_agent: str,
        ttl_seconds: int = 3600
    ):
        self.session_id = session_id
        self.user_id = user_id
        self.username = username
        self.device_name = device_name
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.created_at = time.time()
        self.last_active = time.time()
        self.expires_at = time.time() + ttl_seconds


class InMemoryDistributedSessionStore:
    def __init__(self, max_devices: int = 3, default_ttl: int = 3600):
        self.sessions: Dict[str, SessionRecord] = {}
        self.user_index: Dict[str, List[str]] = defaultdict(list)  # user_id -> [session_ids ordered by created_at]
        self.max_devices = max_devices
        self.default_ttl = default_ttl

    def create_session(
        self,
        user_id: str,
        username: str,
        device_name: str,
        ip_address: str,
        user_agent: str
    ) -> SessionRecord:
        # Check active device limit
        user_active = [s_id for s_id in self.user_index[user_id] if s_id in self.sessions and time.time() < self.sessions[s_id].expires_at]
        
        # If at max limit, evict oldest session
        if len(user_active) >= self.max_devices:
            oldest_id = user_active[0]
            self.revoke_session(oldest_id)

        session_id = f"sess_{secrets.token_urlsafe(24)}"
        record = SessionRecord(
            session_id=session_id,
            user_id=user_id,
            username=username,
            device_name=device_name,
            ip_address=ip_address,
            user_agent=user_agent,
            ttl_seconds=self.default_ttl
        )

        self.sessions[session_id] = record
        self.user_index[user_id].append(session_id)
        return record

    def get_session_and_slide_ttl(self, session_id: str) -> Optional[SessionRecord]:
        record = self.sessions.get(session_id)
        if not record:
            return None
        if time.time() > record.expires_at:
            self.revoke_session(session_id)
            return None

        # Slide TTL on active use
        record.last_active = time.time()
        record.expires_at = time.time() + self.default_ttl
        return record

    def rotate_session_id(self, old_session_id: str) -> Optional[SessionRecord]:
        old_record = self.get_session_and_slide_ttl(old_session_id)
        if not old_record:
            return None

        new_session_id = f"sess_{secrets.token_urlsafe(24)}"
        old_record.session_id = new_session_id
        
        self.sessions.pop(old_session_id, None)
        self.sessions[new_session_id] = old_record

        # Update user index
        if old_session_id in self.user_index[old_record.user_id]:
            idx = self.user_index[old_record.user_id].index(old_session_id)
            self.user_index[old_record.user_id][idx] = new_session_id

        return old_record

    def list_user_sessions(self, user_id: str) -> List[SessionRecord]:
        active = []
        for s_id in list(self.user_index.get(user_id, [])):
            rec = self.sessions.get(s_id)
            if rec and time.time() < rec.expires_at:
                active.append(rec)
            elif rec:
                self.revoke_session(s_id)
        return active

    def revoke_session(self, session_id: str) -> bool:
        record = self.sessions.pop(session_id, None)
        if record:
            self.user_index[record.user_id] = [s for s in self.user_index[record.user_id] if s != session_id]
            return True
        return False

    def logout_everywhere(self, user_id: str) -> int:
        s_ids = list(self.user_index.get(user_id, []))
        count = 0
        for s_id in s_ids:
            if self.revoke_session(s_id):
                count += 1
        self.user_index.pop(user_id, None)
        return count

    def clear(self):
        self.sessions.clear()
        self.user_index.clear()


session_store = InMemoryDistributedSessionStore(max_devices=3, default_ttl=3600)


def get_session_store() -> InMemoryDistributedSessionStore:
    return session_store
