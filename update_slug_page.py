page_code = '''import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Layers, ShieldCheck, Database, Code, CheckCircle2, Terminal, Sparkles } from 'lucide-react';
import { curriculum } from '@/lib/content/curriculum';
import { projectsCatalog } from '@/lib/content/projectsData';
import { VSCodeStudio } from '@/components/projects/VSCodeStudio';

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

  const studioData = projectsCatalog[slug];
  const zipDownloadUrl = `/projects-dist/${project.slug}.zip`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 pt-20 pb-10 px-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <Link href="/projects" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm transition-colors">
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
                {studioData && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Interactive IDE Ready
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">{project.title}</h1>
              <p className="text-slate-300 text-lg md:text-xl max-w-3xl leading-relaxed">{project.description}</p>
            </div>
            
            <div className="shrink-0 flex flex-col gap-3">
              <a 
                href={zipDownloadUrl}
                download
                className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
              >
                <Download className="w-5 h-5 mr-2" /> Download Project (.zip)
              </a>
              <p className="text-slate-500 text-xs text-center">Complete production code & test suite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio / Demo Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {studioData ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-orange-500" />
                  Interactive Project Studio (VS Code Environment)
                </h2>
                <p className="text-sm text-slate-400">
                  Explore full codebase, run interactive API calls, and execute pytest tests directly in the browser.
                </p>
              </div>
            </div>

            <VSCodeStudio projectData={studioData} zipUrl={zipDownloadUrl} />
          </section>
        ) : null}

        <div className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-10">
            {/* Architecture Overview */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Layers className="w-5 h-5 text-indigo-400 mr-2" /> System Architecture & Topology
              </h2>
              <div className="bg-[#0d1117] p-5 rounded-xl border border-slate-800/80 overflow-x-auto">
                <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                  {project.architecture}
                </pre>
              </div>
            </section>
            
            {/* Failure Scenarios */}
            {project.failureScenarios && project.failureScenarios.length > 0 && (
              <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 text-red-400 mr-2" /> Production Failure Engineering
                </h2>
                <div className="space-y-4">
                  {project.failureScenarios.map((fs, idx) => (
                    <div key={idx} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-white mb-2">{fs.title}</h3>
                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Trigger / Root Cause</span>
                          <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono">{fs.trigger || fs.description}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 block">Architecture Resolution</span>
                          <p className="text-xs text-emerald-300 bg-emerald-950/30 p-3 rounded-lg border border-emerald-800/40 font-mono">{fs.resolution || fs.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          
          {/* Right Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4 flex items-center">
                <Database className="w-5 h-5 text-purple-400 mr-2" /> Technologies Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map(t => (
                  <span key={t.id} className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <span>{t.iconEmoji}</span>
                    <span>{t.name}</span>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4 flex items-center">
                <Code className="w-5 h-5 text-blue-400 mr-2" /> Key Skills Mastered
              </h3>
              <ul className="space-y-3">
                {project.skills.map((skill, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 mr-2 shrink-0" />
                    <span className="text-sm text-slate-300">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
              <h4 className="font-bold text-orange-400 mb-2 text-sm uppercase tracking-wide">Production Standard</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                This project adheres to the FastAPI Mastery standard with 100% type safety, clean separation of concerns, and full pytest test coverage.
              </p>
              <a
                href={zipDownloadUrl}
                download
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
              >
                <Download className="w-4 h-4" /> Download Complete Source
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
'''

with open("src/app/projects/[slug]/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_code)

print("Updated src/app/projects/[slug]/page.tsx")
