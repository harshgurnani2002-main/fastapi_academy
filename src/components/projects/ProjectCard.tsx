import Link from 'next/link';
import { ExternalLink, MonitorPlay } from 'lucide-react';

export interface Project {
  id: number;
  slug: string;
  title: string;
  difficulty: 'intermediate' | 'advanced' | 'expert' | 'production';
  hours: number;
  chapter: number;
  chapterSlug?: string;
  description: string;
  architecture: string;
  techs: string[];
  skills: string[];
}

export function ProjectCard({ project }: { project: Project }) {
  const diffColors = {
    intermediate: 'bg-green-500/10 text-green-600 border-green-500/20',
    advanced: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    expert: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    production: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (
    <div className="flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.1)] transition-all duration-300">
      
      {/* Header */}
      <div className="p-6 pb-0 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-lg">
            {project.id}
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border tracking-wide uppercase ${diffColors[project.difficulty]}`}>
            {project.difficulty}
          </span>
        </div>
        <div className="text-slate-500 text-sm font-semibold flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {project.hours}h
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight">
          {project.title}
        </h3>
        <p className="text-slate-600 text-sm mb-6 flex-grow">
          {project.description}
        </p>

        {/* Architecture Diagram */}
        <div className="mb-6 rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre max-w-full">
          {project.architecture}
        </div>

        {/* Skills */}
        <div className="mb-6 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What you'll learn</h4>
          <ul className="space-y-1">
            {project.skills.map(skill => (
              <li key={skill} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {skill}
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.techs.map(tech => (
            <span key={tech} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-semibold border border-slate-200">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-0 mt-auto border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/learn/${project.chapterSlug || `chapter-${project.chapter}`}`} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Part of Chapter {project.chapter}
          </Link>
          
          <div className="flex items-center gap-2">
            <a 
              href={`/projects/${project.slug}/run`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors border border-emerald-200 flex items-center gap-1.5"
              title="Run on Web & Open Docs in New Tab"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Run on Web</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <Link 
              href={`/projects/${project.slug}`} 
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-orange-500/20"
            >
              IDE Studio
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}
