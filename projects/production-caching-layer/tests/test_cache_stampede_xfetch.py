import pytest
import time
from src.core.xfetch import should_xfetch


def test_xfetch_probabilistic_early_expiration():
    now = time.time()
    ttl = 100.0  # 100 seconds TTL

    # 1. Fresh cache entry (cached 2 seconds ago) -> should NOT refresh
    assert should_xfetch(cached_at=now - 2.0, ttl_seconds=ttl, delta_compute_seconds=0.05) is False

    # 2. Near expiration entry (cached 99.9 seconds ago with 100s TTL) -> should refresh
    assert should_xfetch(cached_at=now - 99.9, ttl_seconds=ttl, delta_compute_seconds=10.0) is True
