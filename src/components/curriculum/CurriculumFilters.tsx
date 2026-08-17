'use client';

import { Difficulty } from '@/lib/content/types';

export type DifficultyFilter = Difficulty | 'all';

interface FiltersProps {
  currentDifficulty: DifficultyFilter;
  onDifficultyChange: (diff: DifficultyFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CurriculumFilters({ currentDifficulty, onDifficultyChange, searchQuery, onSearchChange }: FiltersProps) {
  const difficulties: { value: DifficultyFilter; label: string }[] = [
    { value: 'all', label: 'All Levels' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
    { value: 'production', label: 'Production' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 mr-2 font-medium">Filter:</span>
        {difficulties.map((diff) => (
          <button
            key={diff.value}
            onClick={() => onDifficultyChange(diff.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              currentDifficulty === diff.value
                ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {diff.label}
          </button>
        ))}
      </div>
      
      <div className="w-full md:w-64 relative">
        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search chapters..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
        />
      </div>
    </div>
  );
}
