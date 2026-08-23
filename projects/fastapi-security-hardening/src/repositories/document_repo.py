from typing import Optional, List
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.document import DocumentModel
from src.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[DocumentModel]):
    def __init__(self, session: AsyncSession):
        super().__init__(DocumentModel, session)

    async def get_by_owner_and_id(self, document_id: int, owner_id: int) -> Optional[DocumentModel]:
        """Hardened query enforcing Tenant / Owner Isolation (BOLA Mitigation)."""
        stmt = select(DocumentModel).where(
            DocumentModel.id == document_id,
            DocumentModel.owner_id == owner_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def vulnerable_raw_search(self, search_term: str) -> List[DocumentModel]:
        """Intentionally VULNERABLE SQL query susceptible to SQL Injection."""
        raw_sql = f"SELECT * FROM documents WHERE title LIKE '%{search_term}%'"
        result = await self.session.execute(text(raw_sql))
        rows = result.mappings().all()
        return [DocumentModel(**dict(r)) for r in rows]

    async def hardened_parameterized_search(self, search_term: str) -> List[DocumentModel]:
        """Hardened query using parameterized SQL."""
        stmt = select(DocumentModel).where(DocumentModel.title.ilike(f"%{search_term}%"))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
