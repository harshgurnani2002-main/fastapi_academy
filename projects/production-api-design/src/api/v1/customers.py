from typing import List, Optional
from fastapi import APIRouter, Query
from src.schemas.v1.customer import CustomerV1Out
from src.core.pagination import CursorPage, encode_cursor, decode_cursor
from src.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/v1/customers", tags=["Version 1 (Legacy REST)"])

DATABASE_RECORDS = [
    {"id": i, "first_name": f"User{i}", "last_name": f"Smith", "email": f"user{i}@corp.com", "phone": f"+1-555-010{i}", "tier": "gold"}
    for i in range(1, 26)
]


@router.get("", response_model=CursorPage[CustomerV1Out], summary="List Customers (v1 Flat Schema)")
async def list_customers_v1(
    cursor: Optional[str] = Query(None),
    limit: int = Query(default=10, ge=1, le=100)
):
    after_id = decode_cursor(cursor) if cursor else 0
    filtered = [r for r in DATABASE_RECORDS if r["id"] > after_id]
    page_items = filtered[:limit]
    
    has_next = len(filtered) > limit
    next_cur = encode_cursor(page_items[-1]["id"]) if has_next and page_items else None

    v1_items = [
        CustomerV1Out(
            id=r["id"],
            full_name=f"{r['first_name']} {r['last_name']}",
            email=r["email"],
            phone=r["phone"]
        )
        for r in page_items
    ]

    return CursorPage(
        items=v1_items,
        total_count=len(DATABASE_RECORDS),
        has_next=has_next,
        next_cursor=next_cur
    )


@router.get("/{customer_id}", response_model=CustomerV1Out, summary="Get Customer by ID (v1)")
async def get_customer_v1(customer_id: int):
    rec = next((r for r in DATABASE_RECORDS if r["id"] == customer_id), None)
    if not rec:
        raise ResourceNotFoundException("Customer", customer_id)

    return CustomerV1Out(
        id=rec["id"],
        full_name=f"{rec['first_name']} {rec['last_name']}",
        email=rec["email"],
        phone=rec["phone"]
    )
