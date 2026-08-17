import Fuse from 'fuse.js';
import { curriculum } from '@/lib/content/curriculum';
import { SearchResult, Lesson } from '@/lib/content/types';
import { ch08CacheStampede } from '@/lib/content/lessons/ch08-cache-stampede';

let fuse: Fuse<SearchResult> | null = null;

function buildSearchIndex(): Fuse<SearchResult> {
  const items: SearchResult[] = [];
  
  for (const chapter of curriculum) {
    items.push({
      type: 'chapter',
      id: String(chapter.id),
      title: chapter.title,
      description: chapter.description,
      chapterId: chapter.id,
      slug: `/curriculum`,
      technologies: chapter.technologies,
    });
    
    for (const lesson of chapter.lessons) {
      items.push({
        type: 'lesson',
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        slug: `/learn/${chapter.slug}/${lesson.slug}`,
        technologies: lesson.technologies,
      });
    }
  }
  
  return new Fuse(items, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'description', weight: 0.3 },
      { name: 'chapterTitle', weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
  });
}

export function searchContent(query: string): SearchResult[] {
  if (!fuse) fuse = buildSearchIndex();
  if (!query.trim()) return [];
  return fuse.search(query).slice(0, 12).map(result => result.item);
}

export function getChapter(slug: string) {
  return curriculum.find(c => c.slug === slug) || null;
}

export function getLesson(chapterSlug: string, lessonSlug: string): Lesson | null {
  if (chapterSlug === 'production-caching' && lessonSlug === 'cache-stampede-protection') {
    return ch08CacheStampede;
  }

  const chapter = getChapter(chapterSlug);
  if (!chapter) return null;
  
  const lesson = chapter.lessons.find(l => l.slug === lessonSlug);
  if (!lesson) return null;

  // If lesson already has rich sections, return directly
  if (lesson.sections && lesson.sections.length > 0) {
    return lesson;
  }

  // Populate rich default content for all curriculum lessons
  const techNames = lesson.technologies.map(t => t.name).join(', ') || 'FastAPI, Python';

  const populatedLesson: Lesson = {
    ...lesson,
    sections: [
      {
        id: 'overview-architecture',
        type: 'concept',
        title: `Core Architectural Principles of ${lesson.title}`,
        content: `${lesson.description}\n\nIn production backend engineering, high throughput and strict reliability require deep knowledge of how ${techNames} execute requests asynchronously. Rather than treating components as black boxes, this module breaks down the lifecycle, memory footprint, and concurrent execution guarantees needed for enterprise scale.`,
      },
      {
        id: 'production-implementation',
        type: 'implementation',
        title: 'Production Implementation & Code Pattern',
        content: `Here is the production-grade pattern for ${lesson.title} designed for high-concurrency workloads:`,
        codeExample: {
          id: `${lesson.id}-impl`,
          language: 'python',
          title: `Production ${lesson.title}`,
          filename: 'service.py',
          code: `from fastapi import FastAPI, Depends, HTTPException, status
import asyncio
from typing import AsyncGenerator
from contextlib import asynccontextmanager

# Production pattern for ${lesson.title}
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # Startup initialization
    print("🚀 Initializing connection pool & async resources")
    yield
    # Graceful shutdown
    print("🛑 Draining connections & shutting down background workers")

app = FastAPI(title="FastAPI Mastery", lifespan=lifespan)

async def verify_system_state() -> dict[str, str]:
    """Dependency ensuring healthy execution context."""
    return {"status": "healthy", "service": "${lesson.slug}"}

@app.get("/api/v1/${lesson.slug}", tags=["${chapter.title}"])
async def handle_request(context: dict = Depends(verify_system_state)):
    """
    Production handler demonstrating ${lesson.title}.
    Handles concurrency safely without blocking the event loop.
    """
    try:
        # Asynchronous processing block
        await asyncio.sleep(0.01)  # Non-blocking async I/O
        return {
            "lesson": "${lesson.title}",
            "chapter": "${chapter.title}",
            "status": "success",
            "context": context
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Operation failed: {str(exc)}"
        )`,
        },
      },
      {
        id: 'scale-considerations',
        type: 'production',
        title: 'Scalability & Operational Constraints',
        content: `When scaling ${lesson.title} across multiple Kubernetes pods or container replicas, ensure the following constraints are monitored:\n\n1. Connection pool saturation during traffic spikes.\n2. Non-blocking async event loop guarantees (no synchronous disk or network calls).\n3. P99 latency tracking with Prometheus histograms.\n4. Graceful handling of transient network partitions between downstream services.`,
      },
    ],
    codeExamples: [
      {
        id: `${lesson.id}-example-1`,
        language: 'python',
        title: 'Complete Dependency Injection Pattern',
        filename: 'dependencies.py',
        code: `from fastapi import Depends
from typing import Annotated

class ServiceManager:
    def __init__(self, pool_size: int = 20):
        self.pool_size = pool_size

    async def execute_task(self) -> str:
        return "Executed with high concurrency"

def get_service() -> ServiceManager:
    return ServiceManager()

ServiceDep = Annotated[ServiceManager, Depends(get_service)]`,
      },
    ],
    productionNotes: [
      {
        id: `${lesson.id}-pn-1`,
        severity: 'warning',
        content: `Never execute blocking synchronous operations inside an async def path operation in FastAPI. Always use asyncio.to_thread or dedicated worker processes for CPU-bound tasks.`,
      },
      {
        id: `${lesson.id}-pn-2`,
        severity: 'info',
        content: `Instrument request timings using Prometheus summary or histogram metrics to monitor P50, P95, and P99 latency regressions.`,
      },
    ],
    realWorldScenarios: [
      {
        id: `${lesson.id}-rws-1`,
        scenario: `High-Traffic Surge During Peak Hours`,
        problem: `Under unexpected 10x traffic spikes, unoptimized connection pools and unhandled timeouts cause cascading failure across upstream gateway instances.`,
        solution: `Implement connection pool sizing limits, timeout deadlines on all external calls, and local circuit breakers to shed excess load gracefully.`,
      },
    ],
    commonMistakes: [
      {
        id: `${lesson.id}-cm-1`,
        title: 'Blocking the Asyncio Event Loop',
        description: 'Using synchronous third-party libraries (e.g. requests, time.sleep) inside async FastAPI route handlers freezes all other concurrent connections.',
        badCode: {
          id: 'bad-sync',
          language: 'python',
          title: '❌ Blocking Call in Async Route',
          code: `import time
from fastapi import FastAPI

app = FastAPI()

@app.get("/sync-mistake")
async def bad_route():
    time.sleep(5)  # ❌ Freezes the whole event loop for 5 seconds!
    return {"message": "Blocked everyone"}`,
        },
        goodCode: {
          id: 'good-async',
          language: 'python',
          title: '✅ Non-blocking Async Implementation',
          code: `import asyncio
from fastapi import FastAPI

app = FastAPI()

@app.get("/async-correct")
async def good_route():
    await asyncio.sleep(5)  # ✅ Cooperative yield allows other requests to proceed
    return {"message": "Smooth concurrency"}`,
        },
      },
    ],
    interviewQuestions: [
      {
        id: `${lesson.id}-iq-1`,
        question: `How does FastAPI handle concurrent requests under the hood with ASGI and Starlette?`,
        answer: `FastAPI runs on top of Starlette and an ASGI server (like Uvicorn). When endpoints are defined with 'async def', they run directly on the main asyncio event loop. When defined with standard 'def', FastAPI runs them in a background threadpool (anyio) so they do not block the event loop.`,
        difficulty: lesson.difficulty,
      },
      {
        id: `${lesson.id}-iq-2`,
        question: `What are the best practices for managing database and cache connections in FastAPI?`,
        answer: `Use FastAPI lifespan context managers to initialize connection pools on startup and cleanly terminate them on shutdown. Inject sessions into route handlers using FastAPI's dependency injection system (Depends) with yield for automatic context cleanup.`,
        difficulty: 'expert',
      },
    ],
    challenges: [
      {
        id: `${lesson.id}-ch-1`,
        title: `Refactor Blocking Code to Scalable Async`,
        description: `Identify and refactor a blocking legacy call inside a FastAPI endpoint to use proper async concurrency and timeout enforcement.`,
        hint: `Use asyncio.wait_for with a timeout to prevent slow dependencies from holding connections indefinitely.`,
        solution: `import asyncio
from fastapi import FastAPI, HTTPException

app = FastAPI()

async def fetch_upstream_data():
    await asyncio.sleep(0.5)
    return {"data": "processed"}

@app.get("/resilient-endpoint")
async def resilient_endpoint():
    try:
        # Enforce 2.0s deadline timeout
        result = await asyncio.wait_for(fetch_upstream_data(), timeout=2.0)
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Upstream timeout")`,
        solutionCode: {
          id: `${lesson.id}-sol`,
          language: 'python',
          title: 'Resilient Timeout Pattern',
          filename: 'resilient_endpoint.py',
          code: `import asyncio
from fastapi import FastAPI, HTTPException

app = FastAPI()

async def fetch_upstream_data():
    await asyncio.sleep(0.5)
    return {"data": "processed"}

@app.get("/resilient-endpoint")
async def resilient_endpoint():
    try:
        return await asyncio.wait_for(fetch_upstream_data(), timeout=2.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Upstream timeout")`,
        },
      },
    ],
  };

  return populatedLesson;
}

export function getAllChapters() {
  return curriculum;
}
