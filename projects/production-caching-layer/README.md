# Production Caching Layer

High-Throughput Multi-Layer Caching Architecture featuring:
- **L1 In-Process Memory LRU + L2 Distributed Redis Cache**
- **Single-Flight Request Coalescing (Collapsing N concurrent misses into 1 DB query)**
- **XFetch Probabilistic Early Expiration (Zero Cold Miss Spikes)**
- **Negative Caching for 404s**
- **TTL Jitter preventing Cache Avalanche**
- **Cache Warming & Real-time Hit Ratio Metrics (>92%)**

## Run Pytest Suite
```bash
pytest -v
```
