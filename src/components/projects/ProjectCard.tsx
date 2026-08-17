import Link from 'next/link';

export interface Project {
  id: number;
  slug: string;
  title: string;
  difficulty: 'beginner' | 'advanced' | 'expert' | 'production';
  hours: number;
  chapter: number;
  description: string;
  architecture: string;
  techs: string[];
  skills: string[];
}

export function ProjectCard({ project }: { project: Project }) {
  const diffColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    advanced: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    expert: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    production: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="flex flex-col rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-orange-500/50 hover:shadow-[0_0_40px_rgba(249,115,22,0.1)] transition-all duration-300">
      
      {/* Header */}
      <div className="p-6 pb-0 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg">
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
        <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
          {project.title}
        </h3>
        <p className="text-slate-400 text-sm mb-6 flex-grow">
          {project.description}
        </p>

        {/* Architecture Diagram */}
        <div className="mb-6 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre">
          {project.architecture}
        </div>

        {/* Skills */}
        <div className="mb-6 space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What you'll learn</h4>
          <ul className="space-y-1">
            {project.skills.map(skill => (
              <li key={skill} className="flex items-start gap-2 text-sm text-slate-300">
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
            <span key={tech} className="px-2 py-1 bg-slate-800 text-slate-400 rounded-md text-xs font-medium border border-slate-700/50">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-0 mt-auto">
        <div className="flex items-center justify-between">
          <Link href={`/learn/chapter-${project.chapter}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Part of Chapter {project.chapter}
          </Link>
          <Link href={`/projects/${project.slug}`} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20">
            Start Project
          </Link>
        </div>
      </div>
      
    </div>
  );
}
