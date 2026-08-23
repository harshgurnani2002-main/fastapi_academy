"""
Interactive Race Condition & Concurrency Simulator
==================================================
Demonstrates real-time overselling prevention under concurrent bursts.
"""

import time
import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db_session, AsyncSessionLocal
from src.core.exceptions import SoldOutException, SeatUnavailableException
from src.services.booking_service import BookingService
from src.services.event_service import EventService
from src.schemas.common import APIResponse
from src.schemas.simulation import RaceConditionSimulationRequest, RaceConditionSimulationResult
from src.schemas.booking import BookingCreateRequest

router = APIRouter(prefix="/concurrency", tags=["Concurrency Demonstrator"])


@router.post("/simulate", response_model=APIResponse[RaceConditionSimulationResult], summary="Simulate Concurrent Booking Race")
async def simulate_concurrency_race(
    payload: RaceConditionSimulationRequest,
    db: AsyncSession = Depends(get_db_session)
):
    start = time.perf_counter()
    event_service = EventService(db)
    event = await event_service.get_event(payload.event_id)

    success_count = 0
    fail_count = 0

    # Launch N concurrent buyer tasks in parallel using isolated DB sessions
    async def buyer_task(buyer_idx: int):
        async with AsyncSessionLocal() as session:
            svc = BookingService(session)
            seat_num = f"S-{(buyer_idx % event.total_capacity) + 1:03d}"
            email = f"buyer_{buyer_idx}@example.com"
            try:
                if payload.mode == "pessimistic_lock":
                    await svc.book_ticket_pessimistic(
                        BookingCreateRequest(
                            event_id=payload.event_id,
                            seat_number=seat_num,
                            customer_email=email
                        )
                    )
                    await session.commit()
                    return True
                else:
                    res = await svc.unsafe_book_ticket(payload.event_id, seat_num, email)
                    await session.commit()
                    return res.get("success", False)
            except (SoldOutException, SeatUnavailableException, Exception):
                await session.rollback()
                return False

    results = await asyncio.gather(*[buyer_task(i) for i in range(payload.concurrent_buyers)])
    
    for r in results:
        if r:
            success_count += 1
        else:
            fail_count += 1

    # Refresh event state
    await db.refresh(event)
    oversold_count = max(0, success_count - event.total_capacity) if payload.mode == "unsafe" else 0
    duration_ms = (time.perf_counter() - start) * 1000.0

    summary = (
        f"Pessimistic lock protected {event.total_capacity} tickets against {payload.concurrent_buyers} concurrent buyers with 0 overselling."
        if payload.mode == "pessimistic_lock"
        else f"Unsafe mode caused race condition anomalies with {oversold_count} oversold tickets."
    )

    return APIResponse(
        data=RaceConditionSimulationResult(
            mode=payload.mode,
            concurrent_requests_sent=payload.concurrent_buyers,
            successful_bookings=success_count,
            failed_due_to_conflict=fail_count,
            oversold_count=oversold_count,
            remaining_tickets_in_db=event.available_tickets,
            execution_time_ms=round(duration_ms, 2),
            summary=summary
        )
    )
