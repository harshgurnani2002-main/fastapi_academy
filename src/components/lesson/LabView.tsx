'use client';

import React from 'react';
import { Terminal, CheckCircle2, Play } from 'lucide-react';
import { Lab } from '@/lib/content/types';

interface LabProps {
  lab: Lab;
}

export default function LabView({ lab }: LabProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-8 border border-slate-200">
      {/* Light-theme Header */}
      <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center">
        <Terminal className="w-5 h-5 text-emerald-600 mr-3" />
        <h3 className="text-lg font-bold text-emerald-950">Engineering Lab: {lab.title}</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-700 leading-relaxed mb-6">{lab.description}</p>
        
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Setup</h4>
          <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-800 overflow-x-auto whitespace-pre-line border border-slate-200">
            {lab.setupInstructions}
          </div>
        </div>
        
        {lab.tasks && lab.tasks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tasks</h4>
            <ul className="space-y-2.5">
              {lab.tasks.map((task, idx) => (
                <li key={idx} className="flex items-start">
                  <Play className="w-4 h-4 text-orange-500 mr-3 mt-1 shrink-0" />
                  <span className="text-slate-700 leading-relaxed text-sm">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Validation</h4>
          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-lg flex items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-3 shrink-0 mt-0.5" />
            <p className="text-emerald-900 font-mono text-sm whitespace-pre-line leading-relaxed">{lab.validation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
