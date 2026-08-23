# Concurrent Ticket Booking System

Production-grade high-concurrency inventory reservation backend implementing:
- **Pessimistic Row-Level Locking (`SELECT FOR UPDATE`)**
- **Idempotent API Transactions (`Idempotency-Key` Header & Ledger)**
- **Two-Phase Seat Holds with TTL Expiry**
- **Race Condition Demonstrator & Concurrency Simulator**
- **Comprehensive Pytest Concurrency Test Suite**

## Run Pytest Suite
```bash
pytest -v
```
