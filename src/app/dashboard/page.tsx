'use client';

// Note: Next.js App Router does not allow exporting metadata from a 'use client' component.
// In a production app, move this metadata export to a layout.tsx file.
/*
export const metadata = {
  title: 'Dashboard | FastAPI Mastery',
}
*/

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
// Assuming these are exported from a central store file or directory
// import { useProgressStore } from '@/stores/useProgressStore';
// import { useAuthStore } from '@/stores/useAuthStore';

// Mock hooks for demonstration to ensure it works without the actual store files
const useAuthStore = () => ({
  user: { name: 'Harsh' }
});

const useProgressStore = () => ({
  overallProgress: 72,
  chaptersCompleted: 4,
  totalChapters: 25,
  lessonsCompleted: 14,
  totalLessons: 220,
  projectsCompleted: 2,
  totalProjects: 12,
  challengesCompleted: 2,
  totalChallenges: 50,
  streak: 12,
  recentLessons: [
    { title: 'Path Parameters & Data Validation', chapter: 'Basics', badge: 'Ch 2' },
    { title: 'Query Parameters & String Validations', chapter: 'Basics', badge: 'Ch 2' },
    { title: 'Intro to Pydantic Models', chapter: 'Data Modeling', badge: 'Ch 3' },
    { title: 'Nested Models & Field Validations', chapter: 'Data Modeling', badge: 'Ch 3' },
    { title: 'Handling Errors & Exceptions', chapter: 'Basics', badge: 'Ch 2' }
  ],
  bookmarkedLessons: [
    { title: 'Dependency Injection Fundamentals', chapter: 'Dependencies' },
    { title: 'OAuth2 with Password (and Hashing)', chapter: 'Security' }
  ],
  weeklyActivity: [true, true, true, false, true, true, true],
  chapters: [
    { title: 'Getting Started', progress: 100 },
    { title: 'Basics', progress: 100 },
    { title: 'Data Modeling', progress: 100 },
    { title: 'Dependencies', progress: 60 },
    { title: 'Authentication & Authorization', progress: 15 },
    { title: 'Databases & Async ORM', progress: 0 },
  ]
});

export default function DashboardPage() {
  const { user } = useAuthStore();
  const progress = useProgressStore();
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const currentLesson = {
    chapter: 'Authentication & Authorization',
    chapterNum: 5,
    chapterSlug: 'authentication-authorization',
    lesson: 'OAuth 2.0 & PKCE Flow',
    lessonSlug: 'oauth-pkce-flow',
    progress: 72,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 font-sans pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <header>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{greeting}, {user?.name || 'Developer'} 👋</h1>
              <p className="text-slate-500 mt-1">Pick up right where you left off and keep building.</p>
            </header>

            {/* Continue Learning Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all"></div>
              <div className="flex items-center space-x-2 text-orange-600 mb-4 font-bold text-sm uppercase tracking-wider">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                <span>Continue Learning</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Chapter {currentLesson.chapterNum < 10 ? `0${currentLesson.chapterNum}` : currentLesson.chapterNum}: {currentLesson.chapter}</h3>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{currentLesson.lesson}</h2>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-600">Progress</span>
                  <span className="text-slate-900">{currentLesson.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${currentLesson.progress}%` }}></div>
                </div>
              </div>

              <Link href={`/learn/${currentLesson.chapterSlug}/${currentLesson.lessonSlug}`} className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm">
                Continue Learning <span className="ml-2">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Recently Completed */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Recently Completed</h3>
                <ul className="space-y-3">
                  {progress.recentLessons.map((lesson, idx) => (
                    <li key={idx} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="mt-0.5 text-emerald-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{lesson.title}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">{lesson.badge} • {lesson.chapter}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bookmarks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xl font-bold text-slate-900">Bookmarks</h3>
                  <Link href="/dashboard/bookmarks" className="text-sm font-bold text-orange-600 hover:text-orange-700">View All</Link>
                </div>
                <ul className="space-y-3">
                  {progress.bookmarkedLessons.map((lesson, idx) => (
                    <li key={idx} className="flex items-start space-x-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="mt-0.5 text-orange-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{lesson.title}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">{lesson.chapter}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            
            {/* Overall Progress */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 text-center">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Course Progress</h3>
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-orange-500" strokeDasharray={`${progress.overallProgress}, 100`} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{progress.overallProgress}%</span>
                </div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 shadow-sm rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-orange-700/70 uppercase tracking-wider mb-1">Current Streak</h3>
                <div className="text-2xl font-black text-orange-600">{progress.streak} days</div>
              </div>
              <div className="text-4xl">🔥</div>
            </div>

            {/* Weekly Calendar */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Weekly Activity</h3>
              <div className="flex justify-between items-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-2">
                    <span className="text-xs font-bold text-slate-400">{day}</span>
                    <div className={`w-6 h-6 rounded-sm ${progress.weeklyActivity[idx] ? 'bg-orange-500' : 'bg-slate-100 border border-slate-200'}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chapters</div>
                <div className="text-lg font-black text-slate-900">{progress.chaptersCompleted} <span className="text-sm font-semibold text-slate-400">/ {progress.totalChapters}</span></div>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lessons</div>
                <div className="text-lg font-black text-slate-900">{progress.lessonsCompleted} <span className="text-sm font-semibold text-slate-400">/ {progress.totalLessons}</span></div>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Projects</div>
                <div className="text-lg font-black text-slate-900">{progress.projectsCompleted} <span className="text-sm font-semibold text-slate-400">/ {progress.totalProjects}</span></div>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Challenges</div>
                <div className="text-lg font-black text-slate-900">{progress.challengesCompleted} <span className="text-sm font-semibold text-slate-400">/ {progress.totalChallenges}</span></div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom: Chapter Progress */}
        <div className="pt-8">
          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-4 mb-6">Chapter Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progress.chapters.map((ch, idx) => (
              <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-700 truncate pr-4">{ch.title}</h4>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{ch.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${ch.progress === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${ch.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
