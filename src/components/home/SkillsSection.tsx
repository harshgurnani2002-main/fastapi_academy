const skillGroups = [
  {
    category: 'Backend Core',
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-400',
    skills: [
      { name: 'FastAPI', emoji: '⚡' },
      { name: 'Python 3.12+', emoji: '🐍' },
      { name: 'Pydantic v2', emoji: '🛡️' },
      { name: 'Starlette', emoji: '⭐' },
    ]
  },
  {
    category: 'Data & State',
    color: 'bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-400',
    skills: [
      { name: 'PostgreSQL', emoji: '🐘' },
      { name: 'SQLAlchemy 2.0', emoji: '🗄️' },
      { name: 'Alembic', emoji: '🔄' },
      { name: 'Redis', emoji: '🔴' },
    ]
  },
  {
    category: 'Infrastructure',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-400',
    skills: [
      { name: 'Celery', emoji: '🥬' },
      { name: 'RabbitMQ', emoji: '🐇' },
      { name: 'Nginx', emoji: '🌐' },
      { name: 'WebSockets', emoji: '🔌' },
    ]
  },
  {
    category: 'DevOps & Deploy',
    color: 'bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-400',
    skills: [
      { name: 'Docker', emoji: '🐳' },
      { name: 'Kubernetes', emoji: '☸️' },
      { name: 'GitHub Actions', emoji: '🐙' },
      { name: 'Jenkins', emoji: '👷' },
    ]
  },
  {
    category: 'Observability',
    color: 'bg-rose-100 text-rose-700 border-rose-200 hover:border-rose-400',
    skills: [
      { name: 'Prometheus', emoji: '🔥' },
      { name: 'Grafana', emoji: '📊' },
      { name: 'OpenTelemetry', emoji: '🔭' },
      { name: 'ELK Stack', emoji: '🪵' },
    ]
  }
]

export default function SkillsSection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Technologies You Will Master
          </h2>
          <p className="text-lg text-slate-600">
            Understand the trade-offs of the modern production stack. Learn when to use each technology, and more importantly, when not to.
          </p>
        </div>

        <div className="space-y-12">
          {skillGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider mb-6 border-b border-slate-200 pb-2">
                {group.category}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {group.skills.map((skill) => (
                  <div 
                    key={skill.name} 
                    className={`flex items-center gap-3 p-4 bg-white rounded-xl border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md cursor-default ${group.color.split(' ').filter(c => c.startsWith('border') || c.startsWith('hover:border')).join(' ')}`}
                  >
                    <span className="text-2xl">{skill.emoji}</span>
                    <span className="font-semibold text-slate-800">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
