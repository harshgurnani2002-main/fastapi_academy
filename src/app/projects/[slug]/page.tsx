import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Layers, ShieldCheck, Database, Code, CheckCircle2 } from 'lucide-react';
import { curriculum } from '@/lib/content/curriculum';

export async function generateStaticParams() {
  const projects = curriculum.map(c => c.project).filter(Boolean);
  return projects.map((p) => ({
    slug: p.slug,
  }));
}

export default async function ProjectDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const chapter = curriculum.find(c => c.project?.slug === slug);
  const project = chapter?.project;

  if (!project) return notFound();

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-20 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/projects" className="inline-flex items-center text-slate-400 hover:text-white mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to all projects
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${project.difficulty === 'production' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                    project.difficulty === 'expert' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                  {project.difficulty}
                </span>
                <span className="text-slate-400 text-sm flex items-center">
                  <span className="w-1.5 h-1.5 bg-slate-600 rounded-full mr-2"></span>
                  Chapter {project.chapterId}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{project.title}</h1>
              <p className="text-slate-300 text-lg md:text-xl max-w-3xl leading-relaxed">{project.description}</p>
            </div>
            
            <div className="shrink-0 flex flex-col gap-3">
              <a 
                href={`/projects-dist/${project.slug}.zip`}
                className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-orange-500/20"
              >
                <Download className="w-5 h-5 mr-2" /> Download Project (.zip)
              </a>
              <p className="text-slate-500 text-xs text-center">Ready-to-run production boilerplate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-10">
          {/* Architecture */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Layers className="w-6 h-6 text-indigo-500 mr-2" /> System Architecture
            </h2>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 overflow-x-auto">
              <pre className="text-slate-300 font-mono text-sm leading-loose">
                {project.architecture}
              </pre>
            </div>
          </section>
          
          {/* Failure Scenarios */}
          {project.failureScenarios && project.failureScenarios.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <ShieldCheck className="w-6 h-6 text-red-500 mr-2" /> Failure Engineering
              </h2>
              <div className="space-y-4">
                {project.failureScenarios.map((fs, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-2">{fs.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Trigger</span>
                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{fs.trigger || fs.description}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 block">Resolution</span>
                        <p className="text-sm text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100">{fs.resolution || fs.mitigation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Database className="w-5 h-5 text-purple-500 mr-2" /> Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map(t => (
                <span key={t.id} className={`${t.color} ${t.textColor} px-2.5 py-1 rounded text-xs font-bold`}>
                  {t.iconEmoji} {t.name}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Code className="w-5 h-5 text-blue-500 mr-2" /> Skills Acquired
            </h3>
            <ul className="space-y-3">
              {project.skills.map((skill, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 mr-2 shrink-0" />
                  <span className="text-sm text-slate-700">{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
