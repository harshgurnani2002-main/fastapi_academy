import React from 'react';

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const normalizedDifficulty = difficulty.toLowerCase();
  
  const colors: Record<string, string> = {
    intermediate: 'bg-green-100 text-green-700 border-green-200',
    advanced: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    expert: 'bg-orange-100 text-orange-700 border-orange-200',
    production: 'bg-red-100 text-red-700 border-red-200',
  };
  
  const labels: Record<string, string> = {
    intermediate: '🟢 Intermediate',
    advanced: '🟡 Advanced',
    expert: '🟠 Expert',
    production: '🔴 Production',
  };

  const colorClass = colors[normalizedDifficulty] || colors.intermediate;
  const label = labels[normalizedDifficulty] || labels.intermediate;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
}
