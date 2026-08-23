from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.idempotency import IdempotencyModel, IdempotencyState


class IdempotencyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_record(self, key: str) -> Optional[IdempotencyModel]:
        stmt = select(IdempotencyModel).where(IdempotencyModel.key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_in_progress(self, key: str, request_hash: str, ttl_seconds: int) -> IdempotencyModel:
        now = datetime.now(timezone.utc)
        record = IdempotencyModel(
            key=key,
            request_hash=request_hash,
            state=IdempotencyState.PROCESSING,
            expires_at=now + timedelta(seconds=ttl_seconds)
        )
        self.session.add(record)
        await self.session.flush()
        return record

    async def mark_completed(self, key: str, response_code: int, response_body: Dict[str, Any]) -> None:
        record = await self.get_record(key)
        if record:
            record.state = IdempotencyState.COMPLETED
            record.response_code = response_code
            record.response_body = response_body
            await self.session.flush()
