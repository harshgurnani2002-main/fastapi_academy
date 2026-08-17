'use client';

import { useState } from 'react';
import { Project, ProjectCard } from './ProjectCard';

type DifficultyFilter = 'all' | 'beginner' | 'advanced' | 'expert' | 'production';

export function ProjectsList({ initialProjects }: { initialProjects: Project[] }) {
  const [filter, setFilter] = useState<DifficultyFilter>('all');

  const filters: { value: DifficultyFilter; label: string }[] = [
    { value: 'all', label: 'All Projects' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
    { value: 'production', label: 'Production' },
  ];

  const filteredProjects = initialProjects.filter(p => filter === 'all' || p.difficulty === filter);

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              filter === f.value
                ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-xl">No projects found for this difficulty level.</p>
        </div>
      )}
    </div>
  );
}
