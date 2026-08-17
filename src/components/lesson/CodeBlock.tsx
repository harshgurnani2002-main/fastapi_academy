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
}

export default function CodeBlock({
  code,
  language = 'python',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  maxHeight,
  title
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
    if (!mounted) return text; // Avoid hydration mismatch on server
    
    // Simple regex-based syntax highlighting for python
    const keywords = ['def', 'class', 'async', 'await', 'from', 'import', 'return', 'if', 'else', 'elif', 'for', 'while', 'with', 'as', 'try', 'except', 'raise', 'None', 'True', 'False', 'not', 'and', 'or', 'in', 'is'];
    const builtins = ['print', 'len', 'range', 'str', 'int', 'dict', 'list', 'type'];

    let highlighted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight strings (single and double quotes)
    highlighted = highlighted.replace(/("[^"]*"|'[^']*')/g, '<span class="text-green-400">$1</span>');
    
    // Highlight comments
    highlighted = highlighted.replace(/(#.*)/g, '<span class="text-gray-500">$1</span>');
    
    // Highlight decorators
    highlighted = highlighted.replace(/(@[\w\.]+)/g, '<span class="text-orange-400">$1</span>');
    
    // Highlight keywords
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b(?=(?:(?:[^"']*["']){2})*[^"']*$)`, 'g');
    highlighted = highlighted.replace(keywordRegex, '<span class="text-purple-400">$1</span>');

    // Highlight builtins
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b(?=(?:(?:[^"']*["']){2})*[^"']*$)`, 'g');
    highlighted = highlighted.replace(builtinRegex, '<span class="text-blue-300">$1</span>');

    // Highlight class/function names
    highlighted = highlighted.replace(/\b(class|def)\s+([a-zA-Z_]\w*)/g, '<span class="text-purple-400">$1</span> <span class="text-blue-400">$2</span>');

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const lines = code.trimEnd().split('\n');
  const isLong = maxHeight ? lines.length > maxHeight : lines.length > 25;
  const displayLines = !expanded && isLong ? lines.slice(0, maxHeight || 25) : lines;

  return (
    <div className="rounded-xl overflow-hidden bg-[#0d1117] border border-slate-800 shadow-xl my-6 flex flex-col font-mono text-sm">
      {/* Header */}
      {(filename || title || language) && (
        <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-slate-800">
          <div className="flex items-center gap-3">
            {language && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                {language}
              </span>
            )}
            {(filename || title) && (
              <span className="text-slate-400 text-sm font-medium">
                {title || filename}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm focus:outline-none"
            aria-label="Copy code"
          >
            {copied ? (
              <span className="text-green-400 flex items-center gap-1">
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
                className={`flex ${isHighlighted ? 'bg-blue-500/10 -mx-4 px-4 border-l-2 border-blue-400' : 'border-l-2 border-transparent'}`}
              >
                {showLineNumbers && (
                  <div className="w-8 flex-shrink-0 text-slate-600 select-none text-right pr-4 border-r border-slate-800 mr-4">
                    {lineNumber}
                  </div>
                )}
                <div className="text-slate-300 whitespace-pre">
                  {mounted ? highlightCode(line) : line || ' '}
                </div>
              </div>
            );
          })}
        </div>
        
        {!expanded && isLong && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none flex items-end justify-center pb-4">
          </div>
        )}
      </div>
      
      {!expanded && isLong && (
        <button 
          onClick={() => setExpanded(true)}
          className="w-full py-3 bg-[#161b22] text-slate-400 hover:text-white transition-colors text-sm font-medium border-t border-slate-800"
        >
          Expand Code Block ({lines.length - (maxHeight || 25)} more lines)
        </button>
      )}
      {expanded && isLong && (
        <button 
          onClick={() => setExpanded(false)}
          className="w-full py-3 bg-[#161b22] text-slate-400 hover:text-white transition-colors text-sm font-medium border-t border-slate-800"
        >
          Collapse
        </button>
      )}
    </div>
  );
}
