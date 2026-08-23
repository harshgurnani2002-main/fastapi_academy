from typing import List, Optional
from fastapi import APIRouter, Query, status
from src.schemas.v2.customer import CustomerV2Out, CustomerV2Create, CustomerV2Update
from src.core.pagination import CursorPage, encode_cursor, decode_cursor
from src.core.exceptions import ResourceNotFoundException
from src.api.v1.customers import DATABASE_RECORDS

router = APIRouter(prefix="/v2/customers", tags=["Version 2 (Modern REST)"])


@router.get("", response_model=CursorPage[CustomerV2Out], summary="List Customers (v2 Structured Schema with Filtering)")
async def list_customers_v2(
    cursor: Optional[str] = Query(None),
    limit: int = Query(default=10, ge=1, le=100),
    tier: Optional[str] = Query(None, description="Filter by customer tier: standard, gold, enterprise"),
    search: Optional[str] = Query(None, description="Search query against email or name")
):
    after_id = decode_cursor(cursor) if cursor else 0
    filtered = [r for r in DATABASE_RECORDS if r["id"] > after_id]

    if tier:
        filtered = [r for r in filtered if r["tier"].lower() == tier.lower()]
    if search:
        s = search.lower()
        filtered = [r for r in filtered if s in r["email"].lower() or s in r["first_name"].lower()]

    page_items = filtered[:limit]
    has_next = len(filtered) > limit
    next_cur = encode_cursor(page_items[-1]["id"]) if has_next and page_items else None

    v2_items = [
        CustomerV2Out(
            id=r["id"],
            first_name=r["first_name"],
            last_name=r["last_name"],
            email=r["email"],
            phone=r["phone"],
            tier=r["tier"],
            metadata={"account_status": "active", "vip": True}
        )
        for r in page_items
    ]

    return CursorPage(
        items=v2_items,
        total_count=len(DATABASE_RECORDS),
        has_next=has_next,
        next_cursor=next_cur
    )


@router.get("/{customer_id}", response_model=CustomerV2Out, summary="Get Customer by ID (v2)")
async def get_customer_v2(customer_id: int):
    rec = next((r for r in DATABASE_RECORDS if r["id"] == customer_id), None)
    if not rec:
        raise ResourceNotFoundException("Customer", customer_id)

    return CustomerV2Out(
        id=rec["id"],
        first_name=rec["first_name"],
        last_name=rec["last_name"],
        email=rec["email"],
        phone=rec["phone"],
        tier=rec["tier"],
        metadata={"account_status": "active", "loyalty_points": 1500}
    )


@router.post("", response_model=CustomerV2Out, status_code=status.HTTP_201_CREATED, summary="Create Customer (v2)")
async def create_customer_v2(payload: CustomerV2Create):
    new_id = len(DATABASE_RECORDS) + 1
    new_record = {
        "id": new_id,
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "email": payload.email,
        "phone": payload.phone,
        "tier": payload.tier
    }
    DATABASE_RECORDS.append(new_record)
    return CustomerV2Out(
        id=new_id,
        first_name=new_record["first_name"],
        last_name=new_record["last_name"],
        email=new_record["email"],
        phone=new_record["phone"],
        tier=new_record["tier"],
        metadata={"account_status": "active", "created_via": "v2_api"}
    )


@router.patch("/{customer_id}", response_model=CustomerV2Out, summary="Partial Update Customer (v2)")
async def update_customer_v2(customer_id: int, payload: CustomerV2Update):
    rec = next((r for r in DATABASE_RECORDS if r["id"] == customer_id), None)
    if not rec:
        raise ResourceNotFoundException("Customer", customer_id)

    if payload.first_name is not None:
        rec["first_name"] = payload.first_name
    if payload.last_name is not None:
        rec["last_name"] = payload.last_name
    if payload.email is not None:
        rec["email"] = payload.email
    if payload.tier is not None:
        rec["tier"] = payload.tier

    return CustomerV2Out(
        id=rec["id"],
        first_name=rec["first_name"],
        last_name=rec["last_name"],
        email=rec["email"],
        phone=rec["phone"],
        tier=rec["tier"],
        metadata={"account_status": "active", "updated_via": "v2_api"}
    )
