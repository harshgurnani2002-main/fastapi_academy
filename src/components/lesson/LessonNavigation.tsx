'use client';

import React from 'react';
import Link from 'next/link';
import { useProgressStore } from '@/store/progress.store';

interface NavLink {
  title: string;
  slug: string;
  chapterTitle: string;
  isNewChapter?: boolean;
}

interface LessonNavigationProps {
  prev?: NavLink;
  next?: NavLink;
  lessonId: string;
}

export default function LessonNavigation({ prev, next, lessonId }: LessonNavigationProps) {
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const toggleCompleted = useProgressStore((state) => state.toggleCompleted);
  const isComplete = completedLessons.includes(lessonId);

  return (
    <div className="mt-16 pt-8 border-t border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prev ? (
          <Link href={prev.slug} className="group block p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous Lesson</span>
                  {prev.isNewChapter && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                      Previous Chapter
                    </span>
                  )}
                </div>
                <div className="text-sm text-orange-600 font-medium mb-1">{prev.chapterTitle}</div>
                <div className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{prev.title}</div>
              </div>
            </div>
          </Link>
        ) : <div />}

        {next && (
          <Link href={next.slug} className="group block p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-md transition-all bg-white text-right">
            <div className="flex items-center gap-4 justify-end">
              <div>
                <div className="flex items-center justify-end gap-2 mb-1">
                  {next.isNewChapter && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                      <span>✨</span> New Chapter
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Lesson</span>
                </div>
                <div className="text-sm text-orange-600 font-medium mb-1">{next.chapterTitle}</div>
                <div className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{next.title}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </Link>
        )}
      </div>
      
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => toggleCompleted(lessonId)}
          className={`font-semibold py-3 px-8 rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
            isComplete
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 ring-2 ring-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
          }`}
          aria-label={isComplete ? "Mark lesson incomplete" : "Mark lesson complete"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{isComplete ? 'Lesson Completed ✓' : 'Mark Lesson Complete'}</span>
        </button>
      </div>
    </div>
  );
}

