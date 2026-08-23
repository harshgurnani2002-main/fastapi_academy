'use client';

import React, { useState, useEffect } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: number;
  title?: string;
  className?: string;
}

export default function CodeBlock({
  code,
  language = 'python',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  maxHeight,
  title,
  className = ''
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const highlightCode = (text: string) => {
    if (!mounted) return text;
    
    const keywords = new Set(['def', 'class', 'async', 'await', 'from', 'import', 'return', 'if', 'else', 'elif', 'for', 'while', 'with', 'as', 'try', 'except', 'raise', 'None', 'True', 'False', 'not', 'and', 'or', 'in', 'is', 'yield', 'pass']);
    const builtins = new Set(['print', 'len', 'range', 'str', 'int', 'dict', 'list', 'type', 'set']);

    const tokens = text.match(/("[^"]*"|'[^']*'|#.*|\b[a-zA-Z_]\w*\b|.)/g) || [];
    
    let out = '';
    let nextIsFuncOrClass = false;
    
    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.startsWith('"') || token.startsWith("'")) {
        out += `<span class="text-green-600">${escapeHtml(token)}</span>`;
      } else if (token.startsWith('#')) {
        out += `<span class="text-slate-500">${escapeHtml(token)}</span>`;
      } else if (token === '@') {
         let j = i + 1;
         let decorator = '@';
         while (j < tokens.length && (/^[a-zA-Z_]\w*$/.test(tokens[j]) || tokens[j] === '.')) {
           decorator += tokens[j];
           j++;
         }
         out += `<span class="text-orange-600">${escapeHtml(decorator)}</span>`;
         i = j - 1;
      } else if (keywords.has(token)) {
        out += `<span class="text-purple-600">${escapeHtml(token)}</span>`;
        if (token === 'def' || token === 'class') {
          nextIsFuncOrClass = true;
        }
      } else if (builtins.has(token)) {
        out += `<span class="text-blue-600">${escapeHtml(token)}</span>`;
      } else if (/^[a-zA-Z_]\w*$/.test(token)) {
        if (nextIsFuncOrClass) {
          out += `<span class="text-blue-700">${escapeHtml(token)}</span>`;
          nextIsFuncOrClass = false;
        } else {
          out += escapeHtml(token);
        }
      } else {
        out += escapeHtml(token);
        if (token.trim() !== '') {
           nextIsFuncOrClass = false;
        }
      }
    }

    return <div dangerouslySetInnerHTML={{ __html: out }} />;
  };

  const lines = code.trimEnd().split('\n');
  const isLong = maxHeight ? lines.length > maxHeight : lines.length > 25;
  const displayLines = !expanded && isLong ? lines.slice(0, maxHeight || 25) : lines;

  return (
    <div className={`rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm my-6 flex flex-col font-mono text-sm ${className}`}>
      {/* Header */}
      {(filename || title || language) && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {language && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">
                {language}
              </span>
            )}
            {(filename || title) && (
              <span className="text-slate-600 text-sm font-medium">
                {title || filename}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1.5 py-0.5"
            aria-label={copied ? "Code copied to clipboard" : "Copy code to clipboard"}
          >
            <span role="status" aria-live="polite" className="sr-only">
              {copied ? 'Code copied to clipboard' : ''}
            </span>
            {copied ? (
              <span className="text-green-600 flex items-center gap-1 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Copy
              </span>
            )}
          </button>
        </div>
      )}

      {/* Code Area */}
      <div className="relative overflow-x-auto p-4">
        <div className="min-w-max">
          {displayLines.map((line, i) => {
            const lineNumber = i + 1;
            const isHighlighted = highlightLines.includes(lineNumber);
            
            return (
              <div 
                key={i} 
                className={`flex ${isHighlighted ? 'bg-blue-50 -mx-4 px-4 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
              >
                {showLineNumbers && (
                  <div className="w-8 flex-shrink-0 text-slate-400 select-none text-right pr-4 border-r border-slate-200 mr-4">
                    {lineNumber}
                  </div>
                )}
                <div className="text-slate-800 whitespace-pre">
                  {mounted ? highlightCode(line) : line || ' '}
                </div>
              </div>
            );
          })}
        </div>
        
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none flex items-end justify-center pb-4">
          </div>
        )}
      </div>
      
      {!expanded && isLong && (
        <button 
          onClick={() => setExpanded(true)}
          className="w-full py-3 bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium border-t border-slate-200"
        >
          Expand Code Block ({lines.length - (maxHeight || 25)} more lines)
        </button>
      )}
      {expanded && isLong && (
        <button 
          onClick={() => setExpanded(false)}
          className="w-full py-3 bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium border-t border-slate-200"
        >
          Collapse
        </button>
      )}
    </div>
  );
}
