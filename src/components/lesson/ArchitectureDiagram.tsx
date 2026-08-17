import React from 'react';

interface ArchitectureDiagramProps {
  title: string;
  diagram: string;
  caption?: string;
}

export default function ArchitectureDiagram({ title, diagram, caption }: ArchitectureDiagramProps) {
  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-700 shadow-xl bg-[#1a1b26]">
      <div className="bg-[#24283b] px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">{title}</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
          <div className="w-3 h-3 rounded-full bg-slate-600"></div>
        </div>
      </div>
      
      <div className="p-6 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-slate-300">
          <code>{diagram}</code>
        </pre>
      </div>
      
      {caption && (
        <div className="bg-[#16161e] px-6 py-3 border-t border-slate-800 text-sm text-slate-400">
          <span className="font-bold text-orange-400 mr-2">Note:</span>
          {caption}
        </div>
      )}
    </div>
  );
}
