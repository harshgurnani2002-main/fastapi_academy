'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

interface HeroSectionProps {
  stats?: {
    totalChapters: number;
    totalLessons: number;
    totalHours: number;
    totalProjects: number;
  }
}

export default function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-24 pb-32">
      {/* Subtle dot grid pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight mb-6">
              Master FastAPI.<br />
              <span className="text-orange-500">Build Production Systems.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Learn to design, develop, and deploy secure, scalable, observable, and distributed backend systems. Assumes strong Python + FastAPI fundamentals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/learn" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md">
                <Play className="w-5 h-5 mr-2" />
                Start Learning
              </Link>
              <Link href="/curriculum" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md">
                Explore Curriculum
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats?.totalChapters || 25}</div>
                <div className="text-sm text-slate-500 font-medium">Chapters</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats?.totalLessons || 286}</div>
                <div className="text-sm text-slate-500 font-medium">Lessons</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats?.totalProjects || 12}</div>
                <div className="text-sm text-slate-500 font-medium">Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats?.totalHours || 213}</div>
                <div className="text-sm text-slate-500 font-medium">Hours</div>
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Architecture SVG */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-10 left-10 bg-white px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2 z-20"
            >
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="font-semibold text-sm text-slate-700">FastAPI</span>
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 right-10 bg-white px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2 z-20"
            >
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="font-semibold text-sm text-slate-700">PostgreSQL</span>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -8, 0] }} 
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-1/2 -right-4 bg-white px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2 z-20"
            >
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="font-semibold text-sm text-slate-700">Redis</span>
            </motion.div>

            <div className="relative w-full aspect-square bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Client */}
                <circle cx="50" cy="200" r="25" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                <text x="50" y="205" textAnchor="middle" fontSize="12" fill="#475569" fontWeight="bold">Client</text>

                {/* API Gateway */}
                <rect x="110" y="170" width="60" height="60" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
                <text x="140" y="205" textAnchor="middle" fontSize="12" fill="#334155" fontWeight="bold">Gateway</text>

                {/* FastAPI Core */}
                <circle cx="250" cy="200" r="40" fill="#eff6ff" stroke="#3b82f6" strokeWidth="3" filter="url(#glow)" />
                <text x="250" y="205" textAnchor="middle" fontSize="14" fill="#1d4ed8" fontWeight="bold">FastAPI</text>

                {/* DBs and Services */}
                <rect x="330" y="60" width="50" height="50" rx="8" fill="#faf5ff" stroke="#a855f7" strokeWidth="2" />
                <text x="355" y="90" textAnchor="middle" fontSize="11" fill="#7e22ce" fontWeight="bold">Postgres</text>

                <rect x="330" y="140" width="50" height="50" rx="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
                <text x="355" y="170" textAnchor="middle" fontSize="11" fill="#b91c1c" fontWeight="bold">Redis</text>

                <rect x="330" y="220" width="50" height="50" rx="8" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
                <text x="355" y="250" textAnchor="middle" fontSize="11" fill="#047857" fontWeight="bold">Celery</text>

                <rect x="330" y="300" width="50" height="50" rx="8" fill="#fff7ed" stroke="#f97316" strokeWidth="2" />
                <text x="355" y="330" textAnchor="middle" fontSize="11" fill="#c2410c" fontWeight="bold">Monitor</text>

                {/* Static Lines */}
                <path d="M 75 200 L 110 200" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 170 200 L 210 200" stroke="#cbd5e1" strokeWidth="2" />
                
                <path d="M 285 180 Q 310 150 330 85" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                <path d="M 290 190 L 330 165" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 290 210 L 330 245" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 280 220 Q 305 255 330 325" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                {/* Animated Data Flows */}
                <g>
                  <circle cx="0" cy="0" r="3" fill="#f97316" filter="url(#glow)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 75 200 L 110 200" />
                  </circle>
                  <circle cx="0" cy="0" r="3" fill="#f97316" filter="url(#glow)">
                    <animateMotion dur="2s" repeatCount="indefinite" begin="1s" path="M 170 200 L 210 200" />
                  </circle>
                  <circle cx="0" cy="0" r="3" fill="#3b82f6" filter="url(#glow)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s" path="M 285 180 Q 310 150 330 85" />
                  </circle>
                  <circle cx="0" cy="0" r="3" fill="#ef4444" filter="url(#glow)">
                    <animateMotion dur="1s" repeatCount="indefinite" begin="0.2s" path="M 290 190 L 330 165" />
                  </circle>
                </g>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
