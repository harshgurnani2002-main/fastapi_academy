import React from 'react';

interface ArchitectureDiagramProps {
  title: string;
  diagram: string;
  caption?: string;
}

export default function ArchitectureDiagram({ title, diagram, caption }: ArchitectureDiagramProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {/* Light-theme Header */}
      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
          </svg>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wider uppercase">{title}</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
        </div>
      </div>
      
      {/* Light-theme diagram container with high-contrast text */}
      <div className="p-4 sm:p-6 w-full max-w-full overflow-x-auto bg-slate-50 border-b border-slate-100">
        <div className="min-w-fit">
          <pre className="font-mono text-xs sm:text-sm leading-relaxed text-slate-800 font-medium whitespace-pre">
            <code>{diagram}</code>
          </pre>
        </div>
      </div>
      
      {caption && (
        <div className="bg-white px-6 py-3 text-xs sm:text-sm text-slate-600 border-t border-slate-100">
          <span className="font-bold text-orange-600 mr-2">Note:</span>
          {caption}
        </div>
      )}
    </div>
  );
}
