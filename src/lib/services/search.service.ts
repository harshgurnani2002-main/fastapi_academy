import Fuse from 'fuse.js';
import { curriculum } from '@/lib/content/curriculum';
import { SearchResult, Lesson } from '@/lib/content/types';
import { ch08CacheStampede } from '@/lib/content/lessons/ch08-cache-stampede';
import { ch01Lessons } from '@/lib/content/lessons/ch01-lessons';
import { ch02Lessons } from '@/lib/content/lessons/ch02-lessons';
import { ch03Lessons } from '@/lib/content/lessons/ch03-lessons';
import { ch04Lessons } from '@/lib/content/lessons/ch04-lessons';
import { ch05Lessons } from '@/lib/content/lessons/ch05-lessons';
import { ch06Lessons } from '@/lib/content/lessons/ch06-lessons';
import { ch07Lessons } from '@/lib/content/lessons/ch07-lessons';
import { ch08Lessons } from '@/lib/content/lessons/ch08-lessons';
import { ch09Lessons } from '@/lib/content/lessons/ch09-lessons';
import { ch10Lessons } from '@/lib/content/lessons/ch10-lessons';
import { ch11Lessons } from '@/lib/content/lessons/ch11-lessons';
import { ch12Lessons } from '@/lib/content/lessons/ch12-lessons';
import { ch13Lessons } from '@/lib/content/lessons/ch13-lessons';
import { ch14Lessons } from '@/lib/content/lessons/ch14-lessons';
import { ch15Lessons } from '@/lib/content/lessons/ch15-lessons';
import { ch16Lessons } from '@/lib/content/lessons/ch16-lessons';
import { ch17Lessons } from '@/lib/content/lessons/ch17-lessons';
import { ch18Lessons } from '@/lib/content/lessons/ch18-lessons';
import { ch19Lessons } from '@/lib/content/lessons/ch19-lessons';
import { ch20Lessons } from '@/lib/content/lessons/ch20-lessons';
import { ch21Lessons } from '@/lib/content/lessons/ch21-lessons';
import { ch22Lessons } from '@/lib/content/lessons/ch22-lessons';
import { ch23Lessons } from '@/lib/content/lessons/ch23-lessons';
import { ch24Lessons } from '@/lib/content/lessons/ch24-lessons';
import { ch25Lessons } from '@/lib/content/lessons/ch25-lessons';

// Unified enriched lesson lookup: chapter slug -> lesson slug -> Lesson
const enrichedLessons: Record<string, Record<string, Lesson>> = {
  'fastapi-architecture': ch01Lessons,
  'project-structure-standards': ch02Lessons,
  'postgresql-database-engineering': ch03Lessons,
  'atomic-transactions-concurrency': ch04Lessons,
  'authentication-authorization': ch05Lessons,
  'security-engineering': ch06Lessons,
  'redis-deep-dive': ch07Lessons,
  'production-caching': ch08Lessons,
  'rate-limiting': ch09Lessons,
  'background-jobs-celery': ch10Lessons,
  'event-driven-architecture': ch11Lessons,
  'websockets-realtime': ch12Lessons,
  'sessions-distributed-session-management': ch13Lessons,
  'api-design': ch14Lessons,
  'performance-engineering': ch15Lessons,
  'observability': ch16Lessons,
  'testing-production-apis': ch17Lessons,
  'docker-containerization': ch18Lessons,
  'cicd-jenkins-github-actions': ch19Lessons,
  'nginx-networking': ch20Lessons,
  'kubernetes-scaling': ch21Lessons,
  'distributed-systems': ch22Lessons,
  'microservices-architecture': ch23Lessons,
  'production-reliability-engineering': ch24Lessons,
  'capstone-production-saas': ch25Lessons,
};

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
  // 1. Check the special-case standalone lesson file (ch08 cache stampede)
  if (chapterSlug === 'production-caching' && lessonSlug === 'cache-stampede-protection') {
    return ch08CacheStampede;
  }

  // 2. Look up from enriched lesson files
  const chapterLessons = enrichedLessons[chapterSlug];
  if (chapterLessons && chapterLessons[lessonSlug]) {
    return chapterLessons[lessonSlug];
  }

  // 3. Fallback to curriculum skeleton (no rich content)
  const chapter = getChapter(chapterSlug);
  if (!chapter) return null;
  
  const lesson = chapter.lessons.find(l => l.slug === lessonSlug);
  if (!lesson) return null;

  return lesson;
}

export function getAllChapters() {
  return curriculum;
}
