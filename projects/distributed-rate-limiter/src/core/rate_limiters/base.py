from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class RateLimitResult:
    is_allowed: bool
    limit: int
    remaining: int
    reset_epoch: int
    retry_after_seconds: int
    algorithm: str


class BaseRateLimiter(ABC):
    @abstractmethod
    async def evaluate(self, identifier: str, limit: int, window_seconds: int, cost: int = 1) -> RateLimitResult:
        pass
