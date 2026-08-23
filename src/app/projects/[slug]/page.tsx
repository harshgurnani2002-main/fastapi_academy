import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Download, Layers, ShieldCheck, Database, Code, 
  CheckCircle2, Terminal, Sparkles, ExternalLink, Play, MonitorPlay 
} from 'lucide-react';
import { curriculum } from '@/lib/content/curriculum';
import { projectsCatalog } from '@/lib/content/projectsData';
import { VSCodeStudio } from '@/components/projects/VSCodeStudio';

export async function generateStaticParams() {
  const projects = curriculum.map(c => c.project).filter(Boolean);
  return projects.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = curriculum.find(c => c.project?.slug === slug)?.project;
  return {
    title: `${project?.title || 'Project'} | FastAPI Academy`,
    description: project?.description || 'Production-grade FastAPI engineering project.',
  };
}

export default async function ProjectDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const chapter = curriculum.find(c => c.project?.slug === slug);
  const project = chapter?.project;

  if (!project) return notFound();

  const studioData = projectsCatalog[slug];
  const zipDownloadUrl = `/projects-dist/${project.slug}.zip`;
  const webRunUrl = `/projects/${project.slug}/run`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* 1. Hero Header */}
      <div className="bg-white border-b border-slate-200 pt-28 pb-12 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/projects" 
            className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-6 text-sm font-semibold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
            Back to all projects
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider
                  ${project.difficulty === 'production' ? 'bg-red-100 text-red-700 border border-red-200' : 
                    project.difficulty === 'expert' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                    'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                  {project.difficulty}
                </span>
                
                <span className="text-slate-600 text-sm font-semibold flex items-center bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Chapter {project.chapterId}
                </span>

                {studioData && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Interactive IDE Ready
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
                {project.title}
              </h1>
              
              <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-normal">
                {project.description}
              </p>
            </div>
            
            {/* Primary Actions */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
              <a 
                href={webRunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/25 hover:scale-[1.02] text-sm gap-2 text-center"
              >
                <MonitorPlay className="w-5 h-5 fill-white" />
                <span>Run on Web & Docs</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>

              <a 
                href={zipDownloadUrl}
                download
                className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-2xl transition-all border border-slate-300 shadow-sm text-sm"
              >
                <Download className="w-5 h-5 mr-2 text-slate-600" /> Download Project (.zip)
              </a>

              <p className="text-slate-500 text-xs text-center">Complete source code & full test suite</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Studio / Demo Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {studioData ? (
          <section className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-orange-500" />
                  Interactive Project Studio
                </h2>
                <p className="text-sm text-slate-600">
                  Explore full codebase, run interactive API calls, and execute pytest tests in the browser.
                </p>
              </div>

              <a
                href={webRunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3.5 py-2 rounded-xl border border-orange-200 transition-colors shrink-0"
              >
                <MonitorPlay className="w-4 h-4" /> Open Fullscreen Web Runner (New Tab) ↗
              </a>
            </div>

            <VSCodeStudio projectData={studioData} zipUrl={zipDownloadUrl} />
          </section>
        ) : null}

        {/* 3. Deep Dive Architecture & Failure Engineering */}
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Architecture Overview */}
            <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Layers className="w-5 h-5 text-indigo-600 mr-2.5" /> System Architecture & Topology
              </h2>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 overflow-x-auto shadow-inner">
                <pre className="text-emerald-400 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre">
                  {project.architecture}
                </pre>
              </div>
            </section>
            
            {/* Failure Scenarios */}
            {project.failureScenarios && project.failureScenarios.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 text-red-600 mr-2.5" /> Production Failure Engineering
                </h2>
                <div className="space-y-4">
                  {project.failureScenarios.map((fs, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <h3 className="font-bold text-slate-900 mb-3 text-base">{fs.title}</h3>
                      <div className="grid sm:grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Trigger / Root Cause
                          </span>
                          <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-mono leading-relaxed">
                            {fs.trigger || fs.description}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5 block">
                            Architecture Resolution
                          </span>
                          <p className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-mono leading-relaxed">
                            {fs.resolution || fs.mitigation}
                          </p>
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
            {/* Technologies */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <Database className="w-5 h-5 text-purple-600 mr-2" /> Technologies Used
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map(t => (
                  <span key={t.id} className="bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    <span>{t.iconEmoji}</span>
                    <span>{t.name}</span>
                  </span>
                ))}
              </div>
            </div>
            
            {/* Key Skills */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <Code className="w-5 h-5 text-blue-600 mr-2" /> Key Skills Mastered
              </h3>
              <ul className="space-y-3">
                {project.skills.map((skill, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 mr-2.5 shrink-0" />
                    <span className="text-sm text-slate-700 leading-snug">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Production Standard Banner */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-extrabold text-orange-800 mb-2 text-sm uppercase tracking-wide">
                Production Standard
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                This project adheres to the FastAPI Mastery standard with 100% type safety, clean hexagonal separation of concerns, and full pytest test coverage.
              </p>
              
              <div className="space-y-2">
                <a
                  href={webRunUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20"
                >
                  <MonitorPlay className="w-4 h-4" /> Run on Web & Open Docs ↗
                </a>

                <a
                  href={zipDownloadUrl}
                  download
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-300"
                >
                  <Download className="w-4 h-4 text-slate-600" /> Download Complete Source
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
