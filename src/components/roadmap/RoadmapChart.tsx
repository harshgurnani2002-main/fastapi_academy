'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface RoadmapNode {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'upcoming';
  color: string;
  link: string;
}

const roadmapData: RoadmapNode[] = [
  { id: '1', category: 'FOUNDATIONS', title: 'FastAPI Internals & Project Standards', subtitle: 'Ch 01-02 | 14h', status: 'completed', color: 'gray', link: '/learn/fastapi-internals' },
  { id: '2', category: 'DATABASE ENGINEERING', title: 'PostgreSQL, Transactions, Concurrency', subtitle: 'Ch 03-04 | 19h', status: 'completed', color: 'blue', link: '/learn/database-engineering' },
  { id: '3', category: 'AUTHENTICATION & SECURITY', title: 'OAuth, JWT, OWASP, Hardening', subtitle: 'Ch 05-06 | 18h', status: 'current', color: 'red', link: '/learn/auth-security' },
  { id: '4', category: 'REDIS & CACHING', title: 'Redis Internals, Production Caching, Rate Limiting', subtitle: 'Ch 07-09 | 21h', status: 'upcoming', color: 'orange', link: '/learn/redis-caching' },
  { id: '5', category: 'ASYNC SYSTEMS', title: 'Celery, Event-Driven, WebSockets, Sessions', subtitle: 'Ch 10-13 | 29h', status: 'upcoming', color: 'green', link: '/learn/async-celery' },
  { id: '6', category: 'API & PERFORMANCE', title: 'API Design, Performance Engineering', subtitle: 'Ch 14-15 | 16h', status: 'upcoming', color: 'yellow', link: '/learn/api-design' },
  { id: '7', category: 'OBSERVABILITY & TESTING', title: 'Prometheus, OpenTelemetry, Production Testing', subtitle: 'Ch 16-17 | 18h', status: 'upcoming', color: 'yellow', link: '/learn/observability' },
  { id: '8', category: 'INFRASTRUCTURE', title: 'Docker, CI/CD, Nginx, Kubernetes', subtitle: 'Ch 18-21 | 30h', status: 'upcoming', color: 'blue', link: '/learn/docker-containers' },
  { id: '9', category: 'DISTRIBUTED SYSTEMS', title: 'CAP Theorem, Microservices, Circuit Breakers', subtitle: 'Ch 22-23 | 20h', status: 'upcoming', color: 'purple', link: '/learn/microservices' },
  { id: '10', category: 'PRODUCTION MASTERY', title: 'Reliability Engineering + Capstone SaaS', subtitle: 'Ch 24-25 | 28h', status: 'upcoming', color: 'orange', link: '/learn/sre-practices' },
];

const colorMap: Record<string, { border: string, bg: string, text: string, glow: string }> = {
  gray: { border: 'border-slate-500', bg: 'bg-slate-500', text: 'text-slate-400', glow: 'shadow-[0_0_15px_rgba(100,116,139,0.5)]' },
  blue: { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
  red: { border: 'border-red-500', bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' },
  green: { border: 'border-green-500', bg: 'bg-green-500', text: 'text-green-400', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' },
};

export function RoadmapChart() {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-12">
      {/* Center line for desktop */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-slate-800 -translate-x-1/2 rounded-full overflow-hidden">
        {/* Animated flow effect */}
        <div className="w-full h-32 bg-gradient-to-b from-transparent via-orange-500 to-transparent opacity-50 animate-[flow_3s_linear_infinite]" />
      </div>

      <div className="space-y-12 md:space-y-24">
        {roadmapData.map((node, index) => {
          const isEven = index % 2 === 0;
          const colors = colorMap[node.color];
          const isCompleted = node.status === 'completed';
          const isCurrent = node.status === 'current';
          
          return (
            <div key={node.id} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Connector Point */}
              <div className={`absolute left-6 md:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-slate-950 z-10 ${colors.bg} ${isCurrent ? colors.glow + ' animate-pulse' : ''} ${isCompleted ? '' : 'opacity-50'}`}>
                {isCompleted && (
                  <svg className="w-full h-full text-slate-950 p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Content Card */}
              <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? 'md:pr-12' : 'md:pl-12'} flex flex-col ${isEven ? 'md:items-end md:text-right' : 'md:items-start md:text-left'}`}>
                <Link href={node.link} className="block w-full group">
                  <div className={`p-6 rounded-2xl bg-slate-900 border ${isCurrent ? colors.border : 'border-slate-800'} transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-xl`}>
                    <div className={`text-xs font-bold tracking-wider mb-2 ${colors.text}`}>
                      {node.id}. {node.category}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {node.title}
                    </h3>
                    <p className="text-slate-400 font-medium">
                      {node.subtitle}
                    </p>
                    
                    {isCurrent && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        IN PROGRESS
                      </div>
                    )}
                  </div>
                </Link>
              </div>
              
            </div>
          );
        })}
      </div>
      
      {/* Capstone node */}
      <div className="relative mt-24 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-950 bg-gradient-to-tr from-orange-600 to-yellow-500 shadow-[0_0_30px_rgba(249,115,22,0.8)] z-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 mb-2">
            PRODUCTION SAAS PLATFORM
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">
            You've reached the summit. Build a full-stack, distributed SaaS platform utilizing every skill acquired.
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
      `}} />
    </div>
  );
}
