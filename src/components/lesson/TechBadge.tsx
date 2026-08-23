import React from 'react';

export interface Technology {
  name: string;
  color?: string;
  textColor?: string;
}

export default function TechBadge({ tech }: { tech: Technology }) {
  const bgClass = tech.color || 'bg-slate-100';
  const textClass = tech.textColor || 'text-slate-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200 ${bgClass} ${textClass}`}>
      {tech.name}
    </span>
  );
}
