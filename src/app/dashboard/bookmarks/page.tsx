'use client';

import React from 'react';
import Link from 'next/link';

// Mock hook for demonstration
const useProgressStore = () => ({
  bookmarkedLessons: [
    { id: 1, title: 'Dependency Injection Fundamentals', chapter: 'Dependencies', chapterSlug: 'dependencies', lessonSlug: 'di-fundamentals', time: '2 days ago' },
    { id: 2, title: 'OAuth2 with Password (and Hashing)', chapter: 'Security', chapterSlug: 'security', lessonSlug: 'oauth2-password', time: '1 week ago' },
    { id: 3, title: 'Building the App Factory Pattern', chapter: 'Advanced Architecture', chapterSlug: 'advanced-architecture', lessonSlug: 'app-factory', time: '2 weeks ago' }
  ],
  removeBookmark: (id: number) => { /* mock */ }
});

export default function BookmarksPage() {
  const { bookmarkedLessons, removeBookmark } = useProgressStore();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-6 gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-300 flex items-center mb-4 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
            <p className="text-neutral-400 mt-1">Review the concepts you saved for later.</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-sm text-neutral-400">
            {bookmarkedLessons.length} Saved Lessons
          </div>
        </header>

        {bookmarkedLessons.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/30 border border-neutral-800/50 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </div>
            <h3 className="text-xl font-medium text-neutral-300 mb-2">No bookmarks yet</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">Bookmark lessons as you learn to easily find important concepts and references later.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarkedLessons.map(lesson => (
              <div key={lesson.id} className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between transition-all">
                <div className="flex items-start space-x-4 mb-4 md:mb-0">
                  <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-200 group-hover:text-white transition-colors mb-1">{lesson.title}</h3>
                    <div className="flex items-center text-sm text-neutral-500 space-x-3">
                      <span className="bg-neutral-800 px-2.5 py-0.5 rounded text-xs">{lesson.chapter}</span>
                      <span>Bookmarked {lesson.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 md:ml-4 pl-14 md:pl-0">
                  <button 
                    onClick={() => removeBookmark(lesson.id)}
                    className="text-neutral-500 hover:text-red-400 transition-colors p-2"
                    title="Remove bookmark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <Link 
                    href={`/learn/${lesson.chapterSlug}/${lesson.lessonSlug}`}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Go to Lesson
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
