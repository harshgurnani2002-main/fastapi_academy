import pytest
import asyncio
from httpx import AsyncClient
from src.services.caching_service import CachingService


@pytest.mark.asyncio
async def test_single_flight_coalesces_concurrent_requests(client: AsyncClient):
    # 1. Create product
    create_res = await client.post("/api/v1/products", json={
        "sku": "COALESCE-TEST",
        "name": "SingleFlight Test Item",
        "description": "High contention item",
        "price": 49.99,
        "stock_quantity": 100,
        "category": "gadgets"
    })
    prod_id = create_res.json()["data"]["id"]

    # 2. Run simulation endpoint
    sim_res = await client.post(f"/api/v1/demo/simulate-coalescing?product_id={prod_id}")
    assert sim_res.status_code == 200
    data = sim_res.json()["data"]
    assert data["concurrent_requests_sent"] == 30
    assert data["database_queries_executed"] == 1
    assert data["requests_coalesced"] == 29
