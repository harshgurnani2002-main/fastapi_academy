'use client'

import React, { useState } from 'react';
import { Play, Folder, File, Code, Terminal, ExternalLink } from 'lucide-react';
import CodeBlock from './CodeBlock';

interface MultiFileCodeViewerProps {
  example: {
    title: string;
    files?: Record<string, { code: string; language: string }>;
    runnableUrl?: string;
  };
}

export default function MultiFileCodeViewer({ example }: MultiFileCodeViewerProps) {
  const [activeFile, setActiveFile] = useState<string>(
    example.files ? Object.keys(example.files)[0] : ''
  );
  const [isExecuting, setIsExecuting] = useState(false);

  if (!example.files) return null;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm mb-10 border border-slate-800 flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center">
          <Terminal className="w-4 h-4 text-orange-500 mr-2" />
          <h3 className="text-sm font-bold text-slate-200">{example.title}</h3>
        </div>
        {example.runnableUrl && (
          <button
            onClick={() => setIsExecuting(!isExecuting)}
            className={`flex items-center text-xs font-bold px-3 py-1.5 rounded transition-colors ${
              isExecuting 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
            }`}
          >
            {isExecuting ? (
              <>
                <Code className="w-3 h-3 mr-1.5" /> View Code
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1.5" /> Run in Browser
              </>
            )}
          </button>
        )}
      </div>

      {isExecuting && example.runnableUrl ? (
        <div className="flex-1 w-full bg-white relative">
          <iframe 
            src={example.runnableUrl} 
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          ></iframe>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-48 bg-slate-900 border-r border-slate-800 overflow-y-auto py-2 shrink-0">
            <div className="px-3 mb-2 flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Folder className="w-3 h-3 mr-1.5" /> Explorer
            </div>
            <ul className="space-y-0.5">
              {Object.keys(example.files).map((filename) => (
                <li key={filename}>
                  <button
                    onClick={() => setActiveFile(filename)}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center transition-colors ${
                      activeFile === filename
                        ? 'bg-slate-800 text-orange-400 border-r-2 border-orange-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <File className="w-3.5 h-3.5 mr-2 opacity-70" />
                    <span className="truncate">{filename}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-auto bg-[#0d1117] relative">
            {activeFile && example.files[activeFile] && (
              <div className="absolute inset-0">
                <CodeBlock 
                  code={example.files[activeFile].code} 
                  language={example.files[activeFile].language} 
                  showLineNumbers={true}
                  className="h-full rounded-none border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
