import time
from typing import Dict
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from collections import defaultdict


class PrometheusRegistry:
    def __init__(self):
        self.request_count: Dict[str, int] = defaultdict(int)
        self.request_durations: Dict[str, list] = defaultdict(list)
        self.active_requests = 0

    def record_request(self, method: str, path: str, status_code: int, duration_sec: float):
        key = f"{method}_{path}_{status_code}"
        self.request_count[key] += 1
        self.request_durations[path].append(duration_sec)

    def generate_metrics_text(self) -> str:
        lines = [
            "# HELP http_requests_total Total number of HTTP requests processed",
            "# TYPE http_requests_total counter"
        ]
        for key, count in self.request_count.items():
            method, path, status = key.split("_", 2)
            lines.append(f'http_requests_total{{method="{method}",path="{path}",status="{status}"}} {count}')

        lines.extend([
            "",
            "# HELP http_request_duration_seconds HTTP request latency summary",
            "# TYPE http_request_duration_seconds summary"
        ])
        for path, durs in self.request_durations.items():
            avg = sum(durs) / len(durs) if durs else 0.0
            lines.append(f'http_request_duration_seconds{{path="{path}",quantile="0.5"}} {round(avg, 4)}')

        return "\n".join(lines) + "\n"

    def clear(self):
        self.request_count.clear()
        self.request_durations.clear()
        self.active_requests = 0


metrics_registry = PrometheusRegistry()


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        metrics_registry.active_requests += 1
        
        try:
            response = await call_next(request)
            duration = time.perf_counter() - start
            metrics_registry.record_request(request.method, request.url.path, response.status_code, duration)
            return response
        except Exception:
            duration = time.perf_counter() - start
            metrics_registry.record_request(request.method, request.url.path, 500, duration)
            raise
        finally:
            metrics_registry.active_requests -= 1
