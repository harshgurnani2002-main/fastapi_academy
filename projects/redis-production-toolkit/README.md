# Redis Production Toolkit

Enterprise Redis Engineering Suite implementing:
- **Distributed Mutex Locks (SET NX EX + Atomic Lua Release)**
- **Sliding Window Rate Limiter (Sorted Sets + Lua Scripting)**
- **Event-Driven Redis Streams with Consumer Groups (XADD, XREADGROUP, XACK)**
- **Real-Time Pub/Sub Message Bus**
- **Cache-Aside with Cache Stampede / Dogpile Defense**

## Run Pytest Suite
```bash
pytest -v
```
