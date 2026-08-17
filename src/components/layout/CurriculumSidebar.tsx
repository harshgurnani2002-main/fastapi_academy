'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, CheckCircle } from 'lucide-react';
import { curriculum } from '@/lib/content/curriculum';
import { useProgressStore } from '@/store/progress.store';

interface CurriculumSidebarProps {
  className?: string;
  currentChapterId?: number;
  currentLessonId?: string;
}

export default function CurriculumSidebar({ className = "hidden lg:flex w-[280px] h-[calc(100vh-4rem)] sticky top-16", currentChapterId, currentLessonId }: CurriculumSidebarProps) {
  const pathname = usePathname();
  const completedLessons = useProgressStore((state: any) => state.completedLessons);
  
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    curriculum.forEach(ch => {
      initial[String(ch.id)] = pathname.includes(`/learn/${ch.slug}`) || ch.id === currentChapterId;
    });
    if (Object.values(initial).every(v => !v) && curriculum.length > 0) {
      initial[String(curriculum[0].id)] = true;
    }
    return initial;
  });

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [String(chapterId)]: !prev[String(chapterId)]
    }));
  };

  const totalLessons = curriculum.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const totalCompleted = completedLessons.length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((totalCompleted / totalLessons) * 100);

  return (
    <aside className={`flex-col border-r border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Curriculum</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <div className="p-4 space-y-1">
          {curriculum.map((chapter) => {
            const isExpanded = expandedChapters[String(chapter.id)];
            const chapterCompletedLessons = chapter.lessons.filter(l => completedLessons.includes(l.id)).length;
            const isChapterDone = chapter.lessons.length > 0 && chapterCompletedLessons === chapter.lessons.length;
            
            return (
              <div key={chapter.id} className="mb-2">
                <button 
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-400 group-hover:text-orange-500 transition-colors">
                      {String(chapter.id).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 text-left">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isChapterDone ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
                        {chapter.lessons.length > 0 && chapterCompletedLessons > 0 && (
                          <div 
                            className="bg-orange-500 rounded-full" 
                            style={{ 
                              width: `${(chapterCompletedLessons / chapter.lessons.length) * 100}%`,
                              height: '100%' 
                            }} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                </button>
                
                {isExpanded && chapter.lessons.length > 0 && (
                  <div className="mt-1 ml-9 pl-3 border-l border-slate-200 space-y-1 py-1">
                    {chapter.lessons.map((lesson) => {
                      const isActive = pathname === `/learn/${chapter.slug}/${lesson.slug}`;
                      const isCompleted = completedLessons.includes(lesson.id);
                      
                      return (
                        <Link 
                          key={lesson.id}
                          href={`/learn/${chapter.slug}/${lesson.slug}`}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive 
                              ? 'bg-orange-50 text-orange-600 font-medium' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                          ) : isActive ? (
                            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-orange-200 flex-shrink-0" />
                          ) : (
                            <Circle size={14} className="text-slate-300 flex-shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</span>
          <span className="text-sm font-bold text-slate-800">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          {totalCompleted} of {totalLessons} lessons
        </p>
      </div>
    </aside>
  );
}
