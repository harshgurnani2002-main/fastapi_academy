from pydantic import BaseModel
from typing import List, Optional


class BookOut(BaseModel):
    id: int
    title: str


class AuthorDetailOut(BaseModel):
    id: int
    name: str
    books: List[BookOut]


class BenchmarkComparison(BaseModel):
    mode: str
    query_count: int
    simulated_latency_ms: float
    optimization_technique: str
