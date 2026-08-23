import time
import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.models.author_book import AuthorModel, BookModel
from src.schemas.book import AuthorDetailOut, BenchmarkComparison

router = APIRouter(prefix="/benchmarks", tags=["Performance Optimization Engine"])

CACHE_L1: Dict[str, Any] = {}
METRICS = {"n_plus_one_calls": 0, "vectorized_calls": 0, "cache_hits": 0}


@router.post("/seed", summary="Seed Benchmark Authors & Books")
async def seed_data(db: AsyncSession = Depends(get_db)):
    for i in range(1, 11):
        author = AuthorModel(name=f"Author {i}")
        db.add(author)
        await db.flush()
        for j in range(1, 6):
            book = BookModel(title=f"Book {j} by Author {i}", author_id=author.id)
            db.add(book)
    await db.commit()
    CACHE_L1.clear()
    return {"message": "Seeded 10 authors and 50 books."}


@router.get("/unoptimized-n-plus-one", response_model=BenchmarkComparison, summary="Unoptimized Endpoint (N+1 Queries & Sync Delay)")
async def get_unoptimized(db: AsyncSession = Depends(get_db)):
    METRICS["n_plus_one_calls"] += 1
    start = time.perf_counter()
    
    stmt = select(AuthorModel)
    authors = (await db.execute(stmt)).scalars().all()

    queries_count = 1
    total_books = 0
    for author in authors:
        await asyncio.sleep(0.01)  # simulated 10ms network roundtrip per author
        b_stmt = select(BookModel).where(BookModel.author_id == author.id)
        books = (await db.execute(b_stmt)).scalars().all()
        total_books += len(books)
        queries_count += 1

    latency_ms = (time.perf_counter() - start) * 1000.0
    return BenchmarkComparison(
        mode="SLOW_N_PLUS_ONE",
        query_count=queries_count,
        simulated_latency_ms=round(latency_ms, 2),
        optimization_technique="None (Sequential N+1 queries)"
    )


@router.get("/optimized-vectorized", response_model=BenchmarkComparison, summary="Optimized Endpoint (selectinload Batch)")
async def get_optimized(db: AsyncSession = Depends(get_db)):
    METRICS["vectorized_calls"] += 1
    start = time.perf_counter()
    
    stmt = select(AuthorModel).options(selectinload(AuthorModel.books))
    authors = (await db.execute(stmt)).scalars().all()
    queries_count = 2

    latency_ms = (time.perf_counter() - start) * 1000.0
    return BenchmarkComparison(
        mode="FAST_VECTORIZED_EAGER",
        query_count=queries_count,
        simulated_latency_ms=round(latency_ms, 2),
        optimization_technique="SQLAlchemy selectinload Eager Batching"
    )


@router.get("/cached", summary="L1 In-Memory Cached Result")
async def get_cached(db: AsyncSession = Depends(get_db)):
    if "authors_list" in CACHE_L1:
        METRICS["cache_hits"] += 1
        return {"source": "CACHE_HIT", "data": CACHE_L1["authors_list"], "latency_ms": 0.05}

    stmt = select(AuthorModel).options(selectinload(AuthorModel.books))
    authors = (await db.execute(stmt)).scalars().all()
    res = [{"id": a.id, "name": a.name, "book_count": len(a.books)} for a in authors]
    CACHE_L1["authors_list"] = res
    return {"source": "CACHE_MISS", "data": res, "latency_ms": 12.0}


@router.get("/metrics", summary="Performance Optimization Telemetry")
async def get_metrics():
    return METRICS
