'use client';

import React from 'react';
import CodeBlock from './CodeBlock';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content) return null;

  // Helper to parse inline markdown (bold, italic, code, links)
  const renderInline = (text: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchedStr = match[0];

      // Text before match
      if (matchIndex > lastIndex) {
        tokens.push(text.slice(lastIndex, matchIndex));
      }

      if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
        tokens.push(
          <code
            key={matchIndex}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-orange-600 font-mono text-xs sm:text-sm border border-slate-200 font-medium"
          >
            {matchedStr.slice(1, -1)}
          </code>
        );
      } else if (
        (matchedStr.startsWith('**') && matchedStr.endsWith('**')) ||
        (matchedStr.startsWith('__') && matchedStr.endsWith('__'))
      ) {
        tokens.push(
          <strong key={matchIndex} className="font-bold text-slate-900">
            {renderInline(matchedStr.slice(2, -2))}
          </strong>
        );
      } else if (
        (matchedStr.startsWith('*') && matchedStr.endsWith('*')) ||
        (matchedStr.startsWith('_') && matchedStr.endsWith('_'))
      ) {
        tokens.push(
          <em key={matchIndex} className="italic text-slate-800">
            {renderInline(matchedStr.slice(1, -1))}
          </em>
        );
      } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
        const linkMatch = matchedStr.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          tokens.push(
            <a
              key={matchIndex}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 font-semibold underline hover:text-orange-700 transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          tokens.push(matchedStr);
        }
      } else {
        tokens.push(matchedStr);
      }

      lastIndex = matchIndex + matchedStr.length;
    }

    if (lastIndex < text.length) {
      tokens.push(text.slice(lastIndex));
    }

    return tokens;
  };

  // Block-level parser
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block ```
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'python';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <CodeBlock
          key={`code-${i}`}
          code={codeLines.join('\n')}
          language={language}
          showLineNumbers={true}
        />
      );
      continue;
    }

    // 2. Headings
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-slate-900 mt-6 mb-2">
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-slate-900 mt-6 mb-2">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-slate-900 mt-8 mb-3">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl font-black text-slate-900 mt-8 mb-4">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // 3. Unordered list (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 list-disc pl-6 text-slate-700 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 4. Ordered list (1. 2. etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s/, '');
        listItems.push(itemText);
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 space-y-2 list-decimal pl-6 text-slate-700 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 5. Empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 6. Regular paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p key={`p-${i}`} className="text-slate-700 leading-relaxed mb-4 text-base">
          {renderInline(paraLines.join(' '))}
        </p>
      );
    }
  }

  return <div className={`prose-content ${className}`}>{elements}</div>;
}
