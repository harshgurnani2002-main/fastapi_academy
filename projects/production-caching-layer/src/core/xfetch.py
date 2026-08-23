"""
Probabilistic Early Expiration (XFetch Algorithm)
=================================================
Senior Design Note:
Algorithm: Optimal Probabilistic Cache Stampede Prevention (Vattani et al.).
Triggers asynchronous recomputation *before* hard TTL expiry:
  now - (beta * delta * ln(random())) > expiry
"""

import time
import math
import random


def should_xfetch(cached_at: float, ttl_seconds: float, delta_compute_seconds: float = 0.05, beta: float = 1.0) -> bool:
    if ttl_seconds <= 0:
        return True
    
    now = time.time()
    expiry = cached_at + ttl_seconds
    
    # Avoid log(0)
    rand_val = random.random()
    if rand_val <= 0:
        rand_val = 0.0001
        
    # XFetch formula
    probabilistic_delta = - (beta * delta_compute_seconds * math.log(rand_val))
    return (now + probabilistic_delta) >= expiry
