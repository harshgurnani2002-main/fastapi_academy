import React from 'react';
import Link from 'next/link';
import { curriculum } from '@/lib/content/curriculum';

export const metadata = {
  title: 'Engineering Roadmap | FastAPI Mastery',
  description: 'Your path from junior developer to production backend engineer.',
};

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-32">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Backend Engineering <span className="text-orange-500">Roadmap</span></h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A comprehensive, step-by-step path to mastering FastAPI and production backend architecture. 
            Follow the nodes, complete the labs, and build the projects.
          </p>
        </div>

        <div className="relative border-l-4 border-slate-200 ml-6 md:ml-12 space-y-12">
          {curriculum.map((chapter, idx) => (
            <div key={chapter.id} className="relative pl-8 md:pl-16 group">
              {/* Timeline dot */}
              <div className="absolute w-8 h-8 bg-white border-4 border-slate-200 rounded-full -left-[18px] top-1 group-hover:border-orange-500 transition-colors shadow-sm"></div>
              
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-sm font-bold text-orange-500 mb-2 uppercase tracking-wide">Stage {idx + 1}</div>
                    <h2 className="text-2xl font-bold text-slate-900">{chapter.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">{chapter.difficulty}</span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">{chapter.estimatedHours}h</span>
                  </div>
                </div>
                
                <p className="text-slate-600 mb-6 leading-relaxed">{chapter.longDescription}</p>
                
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide">Key Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {chapter.topics.map(topic => (
                      <span key={topic} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-md text-sm font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex gap-2">
                    {chapter.technologies.slice(0, 4).map(tech => (
                      <span key={tech.id} className={`px-2 py-1 ${tech.color} ${tech.textColor} text-xs font-bold rounded-md`}>
                        {tech.iconEmoji} {tech.name}
                      </span>
                    ))}
                    {chapter.technologies.length > 4 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">
                        +{chapter.technologies.length - 4} more
                      </span>
                    )}
                  </div>
                  <Link href={`/learn/${chapter.slug}`} className="inline-flex items-center text-sm font-bold text-orange-500 hover:text-orange-600 group-hover:translate-x-1 transition-transform">
                    Start Stage <span className="ml-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
