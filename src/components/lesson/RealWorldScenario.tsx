import React from 'react';
import CodeBlock from './CodeBlock';

interface CodeExample {
  code: string;
  language?: string;
  filename?: string;
}

interface RealWorldScenarioProps {
  scenario: string;
  problem: string;
  solution: string;
  code?: CodeExample;
}

export default function RealWorldScenario({
  scenario,
  problem,
  solution,
  code
}: RealWorldScenarioProps) {
  return (
    <div className="my-8 rounded-xl border border-green-200 overflow-hidden shadow-sm">
      <div className="bg-green-50 px-6 py-4 border-b border-green-200 flex items-center gap-3">
        <span className="text-2xl">🌎</span>
        <h3 className="text-xl font-bold text-green-800 m-0">Real World Scenario</h3>
      </div>
      
      <div className="p-6 bg-white">
        <div className="mb-6">
          <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2">The Scenario</h4>
          <p className="text-slate-700 leading-relaxed">{scenario}</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-red-50 p-5 rounded-xl border border-red-100">
            <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              The Problem
            </h4>
            <p className="text-slate-700 text-sm">{problem}</p>
          </div>
          
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
            <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              The Solution
            </h4>
            <p className="text-slate-700 text-sm">{solution}</p>
          </div>
        </div>

        {code && (
          <div className="mt-4">
            <CodeBlock 
              code={code.code} 
              language={code.language} 
              filename={code.filename}
            />
          </div>
        )}
      </div>
    </div>
  );
}
