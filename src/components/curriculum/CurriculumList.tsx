'use client';

import { useState } from 'react';
import { Chapter } from '@/lib/content/types';
import { ChapterCard } from './ChapterCard';
import { CurriculumFilters, DifficultyFilter } from './CurriculumFilters';

export function CurriculumList({ initialData }: { initialData: Chapter[] }) {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [search, setSearch] = useState('');

  const filteredData = initialData.filter((chapter) => {
    const matchDiff = difficulty === 'all' || chapter.difficulty === difficulty;
    const matchSearch = chapter.title.toLowerCase().includes(search.toLowerCase()) || 
                        chapter.description.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  return (
    <div className="w-full">
      <CurriculumFilters 
        currentDifficulty={difficulty} 
        onDifficultyChange={setDifficulty}
        searchQuery={search}
        onSearchChange={setSearch}
      />
      
      {filteredData.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <p className="text-xl font-medium">No chapters found matching your filters.</p>
          <button 
            onClick={() => { setDifficulty('all'); setSearch(''); }}
            className="mt-4 text-orange-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} progress={0} />
          ))}
        </div>
      )}
    </div>
  );
}
