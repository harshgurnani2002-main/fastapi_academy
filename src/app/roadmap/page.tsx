import { RoadmapChart } from '@/components/roadmap/RoadmapChart';

export const metadata = {
  title: 'Learning Roadmap | FastAPI Mastery',
  description: 'Your path from FastAPI developer to production backend engineer.',
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-24 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            The Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Roadmap</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed font-light max-w-2xl mx-auto">
            A structured path from absolute fundamentals to distributed systems and site reliability. 
            Follow this step-by-step guide to master production backend engineering.
          </p>
        </div>
      </section>

      {/* Chart Section */}
      <section className="container mx-auto px-6 relative z-10">
        <RoadmapChart />
      </section>
    </main>
  );
}
