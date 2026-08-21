'use client'

import React from 'react';
import { Terminal, CheckCircle2, Play, Clock } from 'lucide-react';
import { Lab } from '@/lib/content/types';

interface LabProps {
  lab: Lab;
}

export default function LabView({ lab }: LabProps) {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm mb-6 border border-slate-800">
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center">
        <Terminal className="w-5 h-5 text-emerald-400 mr-3" />
        <h3 className="text-lg font-bold text-white">Engineering Lab: {lab.title}</h3>
      </div>
      <div className="p-6">
        <p className="text-slate-300 mb-6">{lab.description}</p>
        
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Setup</h4>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-slate-300 overflow-x-auto whitespace-pre-line border border-slate-800">
            {lab.setupInstructions}
          </div>
        </div>
        
        {lab.tasks && lab.tasks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Tasks</h4>
            <ul className="space-y-3">
              {lab.tasks.map((task, idx) => (
                <li key={idx} className="flex items-start">
                  <Play className="w-4 h-4 text-orange-500 mr-3 mt-1 shrink-0" />
                  <span className="text-slate-200">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Validation</h4>
          <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg flex items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
            <p className="text-emerald-100 font-mono text-sm whitespace-pre-line">{lab.validation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
