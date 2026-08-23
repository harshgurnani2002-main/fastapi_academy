import { ProjectsList } from '@/components/projects/ProjectsList';
import { Project } from '@/components/projects/ProjectCard';

export const metadata = {
  title: 'Projects | FastAPI Mastery',
  description: '25 production-grade backend engineering projects.',
};

import { curriculum } from '@/lib/content/curriculum';

const projects: Project[] = curriculum
  .filter(c => c.project)
  .map(c => c.project!)
  .map((p, idx) => ({
    id: idx + 1,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    hours: p.estimatedHours,
    chapter: p.chapterId,
    description: p.description,
    architecture: p.architecture || 'Architecture detailed in project view.',
    techs: p.technologies.map(t => t.name),
    skills: p.skills || [],
  }))
  .sort((a, b) => a.chapter - b.chapter);

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-100 via-slate-50 to-slate-50"></div>
        <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-orange-200/50 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-red-200/50 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-6 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            25 Production Projects
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
            Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Real Systems</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed font-light max-w-2xl mx-auto">
            Stop watching tutorials and start building. Apply what you learn immediately through 
            hands-on, production-grade engineering projects designed to challenge you.
          </p>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section className="container mx-auto px-6 max-w-7xl relative z-10">
        <ProjectsList initialProjects={projects} />
      </section>
    </main>
  );
}
