import React from 'react';

interface ProductionNoteProps {
  content: string;
  severity?: 'info' | 'warning' | 'critical';
  title?: string;
}

export default function ProductionNote({
  content,
  severity = 'warning',
  title = 'Production Note'
}: ProductionNoteProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-900',
      icon: 'text-blue-500',
      title: 'text-blue-800'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      icon: 'text-orange-500',
      title: 'text-orange-800'
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: 'text-red-500',
      title: 'text-red-800'
    }
  };

  const style = styles[severity];

  return (
    <div className={`my-6 rounded-r-xl border-l-4 p-5 ${style.bg} ${style.border}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 mr-3 mt-1 ${style.icon}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div>
          <h4 className={`text-lg font-bold mb-2 ${style.title}`}>
            {title}
          </h4>
          <div className={`prose prose-sm max-w-none ${style.text}`}>
            <p className="leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
