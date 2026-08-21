'use client'

import React from 'react';
import { GitCompare, ThumbsUp, ThumbsDown, Check, Layers, AlertTriangle, Lightbulb } from 'lucide-react';
import { SystemDesign } from '@/lib/content/types';

interface SystemDesignProps {
  design: SystemDesign;
}

export default function SystemDesignView({ design }: SystemDesignProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center">
        <GitCompare className="w-5 h-5 text-indigo-500 mr-3" />
        <h3 className="text-lg font-bold text-slate-900">System Design Trade-offs</h3>
      </div>
      
      <div className="p-6">
        <p className="text-slate-700 mb-6">{design.context}</p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {design.components && design.components.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-indigo-500" /> Components
              </h4>
              <ul className="space-y-1">
                {design.components.map((c, i) => <li key={i} className="text-sm text-slate-600">• {c}</li>)}
              </ul>
            </div>
          )}
          
          {design.challenges && design.challenges.length > 0 && (
            <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
              <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Challenges
              </h4>
              <ul className="space-y-1">
                {design.challenges.map((c, i) => <li key={i} className="text-sm text-red-800/80">• {c}</li>)}
              </ul>
            </div>
          )}

          {design.solutions && design.solutions.length > 0 && (
            <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
              <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-emerald-500" /> Solutions
              </h4>
              <ul className="space-y-1">
                {design.solutions.map((s, i) => <li key={i} className="text-sm text-emerald-800/80">• {s}</li>)}
              </ul>
            </div>
          )}
        </div>
        
        {design.options && design.options.length > 0 && (
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Evaluated Options</h4>
            {design.options.map((opt, i) => (
              <div key={i} className={`border rounded-lg p-4 ${opt.name === design.recommended ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'}`}>
                <h4 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                  {opt.name}
                  {opt.name === design.recommended && (
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Recommended
                    </span>
                  )}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" /> Pros
                    </h5>
                    <ul className="space-y-1">
                      {opt.pros.map((p, j) => (
                        <li key={j} className="text-sm text-slate-600 flex items-start">
                          <span className="text-emerald-500 mr-2">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center">
                      <ThumbsDown className="w-3 h-3 mr-1" /> Cons
                    </h5>
                    <ul className="space-y-1">
                      {opt.cons.map((c, j) => (
                        <li key={j} className="text-sm text-slate-600 flex items-start">
                          <span className="text-red-500 mr-2">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {design.justification && (
          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-indigo-900 mb-2">Architectural Justification</h4>
            <p className="text-sm text-indigo-800 leading-relaxed">{design.justification}</p>
          </div>
        )}
      </div>
    </div>
  );
}
