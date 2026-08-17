import { Technology } from './types';

export const technologies: Record<string, Technology> = {
  fastapi: { id: 'fastapi', name: 'FastAPI', color: 'bg-blue-100', textColor: 'text-blue-700', category: 'backend', iconEmoji: '⚡' },
  python: { id: 'python', name: 'Python', color: 'bg-blue-50', textColor: 'text-blue-600', category: 'backend', iconEmoji: '🐍' },
  postgresql: { id: 'postgresql', name: 'PostgreSQL', color: 'bg-purple-100', textColor: 'text-purple-700', category: 'database', iconEmoji: '🐘' },
  sqlalchemy: { id: 'sqlalchemy', name: 'SQLAlchemy', color: 'bg-purple-50', textColor: 'text-purple-600', category: 'database', iconEmoji: '🗄️' },
  redis: { id: 'redis', name: 'Redis', color: 'bg-red-100', textColor: 'text-red-700', category: 'infrastructure', iconEmoji: '🔴' },
  celery: { id: 'celery', name: 'Celery', color: 'bg-green-100', textColor: 'text-green-700', category: 'infrastructure', iconEmoji: '🥬' },
  docker: { id: 'docker', name: 'Docker', color: 'bg-blue-100', textColor: 'text-blue-700', category: 'devops', iconEmoji: '🐳' },
  kubernetes: { id: 'kubernetes', name: 'Kubernetes', color: 'bg-blue-50', textColor: 'text-blue-600', category: 'devops', iconEmoji: '☸️' },
  nginx: { id: 'nginx', name: 'Nginx', color: 'bg-green-50', textColor: 'text-green-600', category: 'infrastructure', iconEmoji: '🌐' },
  prometheus: { id: 'prometheus', name: 'Prometheus', color: 'bg-yellow-100', textColor: 'text-yellow-700', category: 'observability', iconEmoji: '📊' },
  grafana: { id: 'grafana', name: 'Grafana', color: 'bg-orange-100', textColor: 'text-orange-700', category: 'observability', iconEmoji: '📈' },
  opentelemetry: { id: 'opentelemetry', name: 'OpenTelemetry', color: 'bg-yellow-50', textColor: 'text-yellow-600', category: 'observability', iconEmoji: '🔭' },
  github_actions: { id: 'github_actions', name: 'GitHub Actions', color: 'bg-slate-100', textColor: 'text-slate-700', category: 'devops', iconEmoji: '⚙️' },
  jenkins: { id: 'jenkins', name: 'Jenkins', color: 'bg-slate-50', textColor: 'text-slate-600', category: 'devops', iconEmoji: '🏗️' },
  pydantic: { id: 'pydantic', name: 'Pydantic', color: 'bg-blue-50', textColor: 'text-blue-600', category: 'backend', iconEmoji: '✅' },
  alembic: { id: 'alembic', name: 'Alembic', color: 'bg-purple-50', textColor: 'text-purple-600', category: 'database', iconEmoji: '🧪' },
  websockets: { id: 'websockets', name: 'WebSockets', color: 'bg-emerald-100', textColor: 'text-emerald-700', category: 'backend', iconEmoji: '🔌' },
  jwt: { id: 'jwt', name: 'JWT', color: 'bg-orange-100', textColor: 'text-orange-700', category: 'backend', iconEmoji: '🔐' },
  oauth2: { id: 'oauth2', name: 'OAuth 2.0', color: 'bg-orange-50', textColor: 'text-orange-600', category: 'backend', iconEmoji: '🔑' },
  pytest: { id: 'pytest', name: 'pytest', color: 'bg-green-50', textColor: 'text-green-600', category: 'testing', iconEmoji: '🧪' },
  rabbitmq: { id: 'rabbitmq', name: 'RabbitMQ', color: 'bg-orange-100', textColor: 'text-orange-700', category: 'infrastructure', iconEmoji: '🐰' },
  starlette: { id: 'starlette', name: 'Starlette', color: 'bg-blue-50', textColor: 'text-blue-600', category: 'backend', iconEmoji: '⭐' },
};

export const techList = Object.values(technologies);
