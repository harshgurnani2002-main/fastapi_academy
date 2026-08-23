import Link from 'next/link'
import { ArrowRight, Clock, Box } from 'lucide-react'

const projects = [
  {
    id: 1,
    title: 'Production FastAPI Starter',
    difficulty: 'expert',
    hours: 16,
    arch: 'FastAPI -> PostgreSQL + Redis + Celery',
    techs: ['Python', 'Docker', 'Alembic'],
  },
  {
    id: 2,
    title: 'Authentication Platform',
    difficulty: 'expert',
    hours: 12,
    arch: 'FastAPI -> Google OAuth -> JWT -> Redis',
    techs: ['OAuth2', 'Security', 'Auth'],
  },
  {
    id: 3,
    title: 'Concurrent Ticket Booking',
    difficulty: 'expert',
    hours: 8,
    arch: 'FastAPI -> PostgreSQL (SELECT FOR UPDATE)',
    techs: ['Transactions', 'Concurrency'],
  },
  {
    id: 4,
    title: 'Distributed Rate Limiter',
    difficulty: 'advanced',
    hours: 6,
    arch: 'FastAPI -> Redis (Sliding Window)',
    techs: ['Lua', 'Performance', 'Redis'],
  },
  {
    id: 5,
    title: 'Real-Time Collaboration App',
    difficulty: 'expert',
    hours: 10,
    arch: 'FastAPI -> WebSockets -> Redis Pub/Sub',
    techs: ['WebSockets', 'AsyncIO'],
  },
  {
    id: 6,
    title: 'Production SaaS Capstone',
    difficulty: 'production',
    hours: 40,
    arch: 'Nginx -> FastAPI -> PG/Redis -> K8s',
    techs: ['Kubernetes', 'CI/CD', 'Full Stack'],
  },
]

export default function ProjectsSection() {
  return (
    <section className="py-24 bg-white" id="projects">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            What You Will Build
          </h2>
          <p className="text-lg text-slate-600">
            A curriculum rooted in applied engineering. You will complete 25 rigorous projects, designing architectures that handle real-world scale and complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 group">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                    {project.id}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    project.difficulty === 'production' ? 'bg-purple-100 text-purple-700' :
                    project.difficulty === 'expert' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {project.difficulty}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                  {project.title}
                </h3>
                
                <div className="flex items-center text-sm text-slate-500 mb-6 font-medium">
                  <Clock className="w-4 h-4 mr-1.5" /> 
                  Est. Time: {project.hours} Hours
                </div>
                
                <div className="mb-6">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <Box className="w-3 h-3 mr-1" /> Architecture
                  </div>
                  <div className="bg-slate-900 rounded p-3 text-emerald-400 font-mono text-xs overflow-x-auto">
                    {project.arch}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {project.techs.map(tech => (
                    <span key={tech} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                <Link href={`/projects`} className="text-orange-600 font-semibold text-sm flex items-center hover:text-orange-700 transition-colors">
                  View Specs <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/projects" className="inline-flex justify-center items-center px-6 py-3 text-base font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md">
            View All 25 Projects
          </Link>
        </div>
      </div>
    </section>
  )
}
