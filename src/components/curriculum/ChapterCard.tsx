import Link from 'next/link';
import { Chapter } from '@/lib/content/types';

export function ChapterCard({ chapter, progress = 0 }: { chapter: Chapter; progress?: number }) {
  const diffColors: Record<string, string> = {
    intermediate: 'bg-green-500/10 text-green-500 border-green-500/20',
    advanced: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    expert: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    production: 'bg-red-500/10 text-red-500 border-red-500/20',
    all: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  const primaryCategory = chapter.technologies[0]?.category || 'backend';

  return (
    <div className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all duration-300">
      <div className="absolute top-6 right-6 text-6xl font-black text-slate-100 group-hover:text-slate-200 transition-colors pointer-events-none">
        {chapter.id.toString().padStart(2, '0')}
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${diffColors[chapter.difficulty] || diffColors.advanced}`}>
            {chapter.difficulty.toUpperCase()}
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{primaryCategory}</span>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{chapter.title}</h3>
          <p className="text-slate-600 text-sm line-clamp-2">{chapter.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {chapter.technologies.slice(0, 3).map(tech => (
            <span key={tech.id} className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700">
              {tech.name}
            </span>
          ))}
          {chapter.technologies.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-600">
              +{chapter.technologies.length - 3} more
            </span>
          )}
        </div>
      </div>
      
      <div className="relative z-10 pt-6 mt-6 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {chapter.estimatedHours}h
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {chapter.lessons.length} lessons
          </div>
        </div>
        
        {progress > 0 && (
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4 overflow-hidden">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        
        <Link 
          href={`/learn/${chapter.slug}`}
          className="block w-full py-2.5 px-4 text-center text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-xl transition-colors duration-200"
        >
          {progress > 0 ? 'Continue Chapter' : 'Start Chapter'}
        </Link>
      </div>
    </div>
  );
}
