import { Server, Shield, Zap, Network, TestTube, Activity, GitBranch, Briefcase } from 'lucide-react'

const reasons = [
  {
    title: 'Production Architecture',
    description: 'Build systems that actually run in production. Learn feature-based structure, dependency injection, and clean boundaries.',
    icon: Server,
  },
  {
    title: 'Security Engineering',
    description: 'Implement OWASP Top 10 defenses, robust auth (JWT, OAuth 2.0, PKCE), RBAC, and system hardening.',
    icon: Shield,
  },
  {
    title: 'Performance & Scale',
    description: 'Learn to measure and optimize P50/P95/P99 latency against explicit workload SLOs. Profile endpoints, optimize DB queries, and configure connection pools.',
    icon: Zap,
  },
  {
    title: 'Distributed Systems',
    description: 'Master Redis, Celery, and RabbitMQ. Build event-driven architectures, handle race conditions, and implement distributed locking.',
    icon: Network,
  },
  {
    title: 'Testing Mastery',
    description: 'Go beyond basic asserts. Master unit, integration, end-to-end, load testing, and property-based testing pipelines.',
    icon: TestTube,
  },
  {
    title: 'Full Observability',
    description: 'Instrument your app with OpenTelemetry, aggregate logs, and build dashboards in Grafana to monitor latency and errors.',
    icon: Activity,
  },
  {
    title: 'DevOps & Deployment',
    description: 'Containerize with Docker, orchestrate with Kubernetes, and build pipelines with isolated test stages, image scanning, and automated rollback.',
    icon: GitBranch,
  },
  {
    title: 'Real-World Projects',
    description: 'Build 12 production-grade projects from scratch, simulating real business requirements and technical challenges.',
    icon: Briefcase,
  },
]

export default function WhySection() {
  return (
    <section className="py-24 bg-white" id="why">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Why FastAPI Mastery?
          </h2>
          <p className="text-lg text-slate-600">
            Most tutorials stop at "Hello World". We start where they end, focusing exclusively on the engineering practices required for enterprise-grade backend systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            return (
              <div 
                key={index} 
                className="group relative bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Orange hover accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {reason.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
