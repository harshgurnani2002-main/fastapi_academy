# Distributed Redis Rate Limiter

Production-Grade Distributed Rate Limiting System featuring:
- **Sliding Window Log with Redis Sorted Sets (ZSET)**
- **Token Bucket Algorithm with Smooth Replenishment & Burst Capacity**
- **Fixed Window Counter**
- **IETF HTTP Headers (X-RateLimit-Limit, Remaining, Reset, Retry-After)**
- **Multi-Tiered Limiting (IP, User ID, API Key)**
- **Interactive Burst Simulator**

## Run Pytest Suite
```bash
pytest -v
```
