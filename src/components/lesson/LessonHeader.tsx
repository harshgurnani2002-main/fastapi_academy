'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DifficultyBadge from './DifficultyBadge';
import TechBadge from './TechBadge';

export default function LessonHeader({ lesson, chapter }: any) {
  const [objectives, setObjectives] = useState<boolean[]>(
    lesson.objectives?.map(() => false) || []
  );

  const toggleObjective = (index: number) => {
    const newObj = [...objectives];
    newObj[index] = !newObj[index];
    setObjectives(newObj);
  };

  return (
    <div className="mb-10 border-b border-slate-200 pb-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-slate-500 mb-6 flex-wrap gap-1">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <svg className="w-4 h-4 mx-1 text-slate-300 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <Link 
          href={`/curriculum#chapter-${chapter.id || chapter.slug}`} 
          className="hover:text-orange-600 transition-colors font-medium text-slate-600"
        >
          {chapter.title}
        </Link>
        <svg className="w-4 h-4 mx-1 text-slate-300 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <span className="text-slate-900 font-semibold truncate max-w-md">{lesson.title}</span>
      </nav>

      {/* Title & Badges */}
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        {lesson.title}
      </h1>
      
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <DifficultyBadge difficulty={lesson.difficulty || 'intermediate'} />
        
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {lesson.duration || '15 min'}
        </span>

        {lesson.technologies?.map((tech: any, i: number) => (
          <TechBadge key={i} tech={tech} />
        ))}
      </div>

      {/* Learning Objectives */}
      {lesson.objectives && lesson.objectives.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Learning Objectives
          </h3>
          <ul className="space-y-3">
            {lesson.objectives.map((obj: string, i: number) => (
              <li 
                key={i} 
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => toggleObjective(i)}
              >
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${objectives[i] ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-300 text-transparent group-hover:border-orange-400'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className={`text-slate-700 transition-colors ${objectives[i] ? 'text-slate-500 line-through' : ''}`}>
                  {obj}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
