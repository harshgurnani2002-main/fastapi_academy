'use client';

// Note: Next.js App Router does not allow exporting metadata from a 'use client' component.
// In a production app, move this metadata export to a layout.tsx file.
/*
export const metadata = {
  title: 'Technologies | FastAPI Mastery',
}
*/

import React, { useState } from 'react';
import Link from 'next/link';

const techDetails = {
  fastapi: { id: 'fastapi', category: 'Backend', emoji: '⚡', name: 'FastAPI', desc: 'The modern Python web framework for building high-performance APIs with automatic OpenAPI documentation and type safety via Pydantic.', lessons: 38, chapters: [1,2,5,6,14,15] },
  postgresql: { id: 'postgresql', category: 'Database', emoji: '🐘', name: 'PostgreSQL', desc: 'The world\'s most advanced open source relational database. We use PostgreSQL for production data storage, transactions, and complex queries.', lessons: 24, chapters: [3,4,11] },
  redis: { id: 'redis', category: 'Database', emoji: '🔴', name: 'Redis', desc: 'An in-memory data structure store used as cache, message broker, and session store. Redis supports atomic operations, Lua scripts, and Pub/Sub.', lessons: 22, chapters: [7,8,9,12,13] },
  celery: { id: 'celery', category: 'Backend', emoji: '🥬', name: 'Celery', desc: 'Distributed task queue for Python. We use Celery to offload long-running tasks, schedule periodic jobs, and build async processing pipelines.', lessons: 12, chapters: [10] },
  docker: { id: 'docker', category: 'Infrastructure', emoji: '🐳', name: 'Docker', desc: 'Container platform for packaging applications and dependencies. Every project is containerized with multi-stage builds and security best practices.', lessons: 10, chapters: [18,25] },
  kubernetes: { id: 'kubernetes', category: 'Infrastructure', emoji: '☸️', name: 'Kubernetes', desc: 'Container orchestration platform for deploying, scaling, and managing containerized applications with HPA, rolling deployments, and ingress.', lessons: 12, chapters: [21] },
  prometheus: { id: 'prometheus', category: 'Observability', emoji: '📊', name: 'Prometheus', desc: 'Open-source monitoring and alerting toolkit. We scrape metrics from FastAPI services and build dashboards showing latency, error rate, and throughput.', lessons: 8, chapters: [16] },
  grafana: { id: 'grafana', category: 'Observability', emoji: '📈', name: 'Grafana', desc: 'Analytics platform for visualizing metrics. We build production dashboards showing P50/P95/P99 latencies, cache hit ratios, and error budgets.', lessons: 6, chapters: [16] },
  opentelemetry: { id: 'opentelemetry', category: 'Observability', emoji: '🔭', name: 'OpenTelemetry', desc: 'Vendor-neutral observability framework for distributed tracing. Generates trace IDs and spans across service boundaries.', lessons: 8, chapters: [16,22] },
  nginx: { id: 'nginx', category: 'Infrastructure', emoji: '🌐', name: 'Nginx', desc: 'High-performance reverse proxy and web server. Used for TLS termination, load balancing, rate limiting, and WebSocket proxying.', lessons: 9, chapters: [20] },
};

const categories = ['All', 'Backend', 'Database', 'Infrastructure', 'DevOps', 'Observability', 'Testing'];

export default function TechnologiesPage() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredTech = Object.values(techDetails).filter(
    tech => activeTab === 'All' || tech.category === activeTab
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-6 md:p-12 lg:p-20">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Technology Explorer</h1>
          <p className="text-lg text-neutral-400">Discover the modern, production-grade stack we use to build scalable APIs and distributed systems in FastAPI Mastery.</p>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 pb-4 border-b border-neutral-800">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === category 
                  ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' 
                  : 'bg-neutral-900 text-neutral-400 border border-transparent hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTech.map((tech) => (
            <div 
              key={tech.id} 
              className="group bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-neutral-800 rounded-xl flex items-center justify-center text-3xl shadow-inner group-hover:bg-neutral-800/80 transition-colors">
                  {tech.emoji}
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-neutral-800 text-neutral-300 rounded-full">
                  {tech.category}
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">{tech.name}</h2>
              <p className="text-neutral-400 text-sm flex-grow mb-6 leading-relaxed">
                {tech.desc}
              </p>
              
              <div className="pt-4 border-t border-neutral-800 mt-auto flex items-center justify-between">
                <div className="flex items-center text-sm text-neutral-300 font-medium bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
                  {tech.lessons} Lessons
                </div>
                <div className="flex -space-x-2">
                  {tech.chapters.slice(0, 3).map((ch, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-300 z-10" title={`Chapter ${ch}`}>
                      Ch{ch}
                    </div>
                  ))}
                  {tech.chapters.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-neutral-900 flex items-center justify-center text-[10px] font-bold text-neutral-400 z-0">
                      +{tech.chapters.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTech.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-500">No technologies found in this category.</p>
          </div>
        )}

      </div>
    </div>
  );
}
