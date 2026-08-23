"""
Transactional Outbox & Idempotent Event Service
================================================
Senior Design Note:
Guarantees AT-LEAST-ONCE delivery by saving event to outbox table in same DB transaction.
Consumer uses `ProcessedEventModel` table to guarantee EXACTLY-ONCE business processing.
"""

import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models.order_and_outbox import OrderModel, OutboxEventModel, ProcessedEventModel
from src.core.event_bus import InMemoryEventBus, event_bus
from src.schemas.order import OrderCreate


class OrderEventService:
    def __init__(self, session: AsyncSession, bus: InMemoryEventBus = event_bus):
        self.session = session
        self.bus = bus

    async def create_order_with_outbox(self, payload: OrderCreate) -> OrderModel:
        order_num = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # 1. Insert Order
        order = OrderModel(
            order_number=order_num,
            customer_email=payload.customer_email,
            total_amount=payload.total_amount,
            status="CREATED"
        )
        self.session.add(order)
        await self.session.flush()

        # 2. Insert Outbox Event Atomically in Same Transaction
        outbox_event = OutboxEventModel(
            aggregate_type="ORDER",
            aggregate_id=order_num,
            event_type="OrderCreated",
            payload={
                "order_id": order.id,
                "order_number": order_num,
                "customer_email": payload.customer_email,
                "total_amount": payload.total_amount,
                "items": payload.items
            },
            published=False
        )
        self.session.add(outbox_event)
        await self.session.flush()
        return order

    async def relay_outbox_events(self, stream_name: str = "stream:orders") -> List[str]:
        # 1. Fetch unpublished outbox events
        stmt = select(OutboxEventModel).where(OutboxEventModel.published == False).limit(50)
        result = await self.session.execute(stmt)
        events = result.scalars().all()

        relayed_ids = []
        for ev in events:
            # 2. Publish to Event Broker
            msg_id = await self.bus.xadd(stream_name, {
                "event_id": f"evt-{ev.id}",
                "event_type": ev.event_type,
                "aggregate_id": ev.aggregate_id,
                "payload": ev.payload
            })
            # 3. Mark published
            ev.published = True
            relayed_ids.append(msg_id)

        await self.session.flush()
        return relayed_ids

    async def consume_events_idempotently(self, stream_name: str, consumer_name: str) -> Dict[str, int]:
        records = await self.bus.get_stream_records(stream_name)
        processed_count = 0
        duplicate_count = 0

        for r in records:
            event_id = r["fields"].get("event_id") or r["id"]
            
            # Idempotency Check: query processed_events
            stmt = select(ProcessedEventModel).where(
                ProcessedEventModel.event_id == event_id,
                ProcessedEventModel.consumer_name == consumer_name
            )
            existing = (await self.session.execute(stmt)).scalar_one_or_none()

            if existing:
                duplicate_count += 1
                continue

            # Process domain logic (e.g. mark order PAID)
            agg_id = r["fields"].get("aggregate_id")
            if agg_id:
                order_stmt = select(OrderModel).where(OrderModel.order_number == agg_id)
                order = (await self.session.execute(order_stmt)).scalar_one_or_none()
                if order and order.status == "CREATED":
                    order.status = "PROCESSING"

            # Record in deduplication table
            record_entry = ProcessedEventModel(
                event_id=event_id,
                consumer_name=consumer_name
            )
            self.session.add(record_entry)
            processed_count += 1

        await self.session.flush()
        return {"processed": processed_count, "duplicates": duplicate_count}
