import asyncio
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.product import ProductModel
from src.repositories.base import BaseRepository


class ProductRepository(BaseRepository[ProductModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(ProductModel, session)
        self.simulated_db_latency_sec = 0.03  # 30ms DB lookup penalty

    async def get_product_by_id_with_delay(self, product_id: int) -> Optional[ProductModel]:
        # Simulate realistic PostgreSQL query latency
        await asyncio.sleep(self.simulated_db_latency_sec)
        stmt = select(ProductModel).where(ProductModel.id == product_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
