import { curriculum } from '@/lib/content/curriculum';
import { CurriculumList } from '@/components/curriculum/CurriculumList';

export const metadata = {
  title: 'Curriculum | FastAPI Mastery',
  description: 'Complete 25-chapter curriculum for mastering FastAPI and production backend engineering.',
};

export default function CurriculumPage() {
  const totalChapters = curriculum.length;
  const totalLessons = curriculum.reduce((acc, ch) => acc + ch.lessons.length, 0);
  const totalHours = curriculum.reduce((acc, ch) => acc + ch.estimatedHours, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-slate-50 to-slate-50"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full"></div>
        
        <div className="container mx-auto px-6 relative z-10 max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              The Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Curriculum</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed font-light">
              From absolute fundamentals to distributed systems and site reliability. 
              Everything you need to master FastAPI and production backend engineering.
            </p>
            
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-slate-900">{totalChapters}</span>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Chapters</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-slate-900">{totalLessons}</span>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Lessons</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-slate-900">{totalHours}</span>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-6 max-w-6xl mt-16">
        <CurriculumList initialData={curriculum} />
      </section>
    </main>
  );
}
