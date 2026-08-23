'use client';

import React, { useMemo } from 'react';

interface CodeHighlighterProps {
  code: string;
  language?: string;
  theme?: 'light' | 'dark';
  showLineNumbers?: boolean;
  highlightedLine?: number | null;
  onLineClick?: (lineNum: number) => void;
  className?: string;
}

// Token categories
type TokenType = 
  | 'plain'
  | 'keyword'
  | 'decorator'
  | 'function'
  | 'class'
  | 'builtin'
  | 'string'
  | 'comment'
  | 'number'
  | 'boolean'
  | 'operator'
  | 'property'
  | 'section'
  | 'heading';

interface Token {
  type: TokenType;
  text: string;
}

const PYTHON_KEYWORDS = new Set([
  'def', 'class', 'async', 'await', 'from', 'import', 'return', 'if', 'else',
  'elif', 'for', 'while', 'with', 'as', 'try', 'except', 'finally', 'raise',
  'yield', 'pass', 'lambda', 'in', 'is', 'not', 'and', 'or', 'global',
  'nonlocal', 'assert', 'break', 'continue', 'del'
]);

const PYTHON_BUILTINS = new Set([
  'self', 'cls', 'None', 'True', 'False', 'int', 'str', 'float', 'bool',
  'list', 'dict', 'set', 'tuple', 'bytes', 'type', 'len', 'print', 'range',
  'enumerate', 'zip', 'super', 'isinstance', 'issubclass', 'iter', 'next',
  'min', 'max', 'sum', 'any', 'all', 'open', 'id', 'getattr', 'setattr',
  'hasattr', 'delattr', 'FastAPI', 'APIRouter', 'Depends', 'HTTPException',
  'status', 'BaseModel', 'Field', 'ConfigDict', 'EmailStr', 'Session',
  'AsyncSession', 'select', 'func', 'Column', 'Integer', 'String', 'Boolean',
  'Float', 'DateTime', 'ForeignKey', 'relationship', 'DeclarativeBase',
  'create_async_engine', 'async_sessionmaker', 'AsyncGenerator', 'Optional',
  'Union', 'List', 'Dict', 'Any', 'Tuple', 'Set', 'Generic', 'TypeVar',
  'Header', 'Query', 'Path', 'Body', 'File', 'UploadFile', 'BackgroundTasks',
  'Security', 'CORSMiddleware', 'BaseSettings', 'SettingsConfigDict',
  'field_validator', 'model_validator', 'JSONResponse', 'Request', 'Response'
]);

const DOCKER_KEYWORDS = new Set([
  'FROM', 'WORKDIR', 'RUN', 'COPY', 'ADD', 'ENV', 'EXPOSE', 'CMD',
  'ENTRYPOINT', 'VOLUME', 'USER', 'ARG', 'LABEL', 'STOPSIGNAL',
  'HEALTHCHECK', 'SHELL', 'AS', 'as'
]);

const SHELL_COMMANDS = new Set([
  'uvicorn', 'pytest', 'pip', 'pip3', 'python', 'python3', 'docker',
  'docker-compose', 'curl', 'git', 'export', 'echo', 'cd', 'mkdir', 'cp',
  'rm', 'ls', 'cat', 'grep', 'source', 'apt-get', 'systemctl'
]);

function tokenizeLine(line: string, language: string = 'python'): Token[] {
  const lang = language.toLowerCase();
  const tokens: Token[] = [];

  if (lang === 'markdown' || lang === 'md') {
    if (line.startsWith('#')) {
      return [{ type: 'heading', text: line }];
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\s*\d+\.\s/.test(line)) {
      return [
        { type: 'keyword', text: line.match(/^\s*(-|\*|\d+\.)\s/)?.[0] || '' },
        { type: 'plain', text: line.replace(/^\s*(-|\*|\d+\.)\s/, '') }
      ];
    }
    if (line.startsWith('```')) {
      return [{ type: 'comment', text: line }];
    }
  }

  if (lang === 'dockerfile') {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      return [{ type: 'comment', text: line }];
    }
    const firstWordMatch = line.match(/^(\s*)([A-Z_]+)(\s*.*)$/);
    if (firstWordMatch && DOCKER_KEYWORDS.has(firstWordMatch[2])) {
      return [
        { type: 'plain', text: firstWordMatch[1] },
        { type: 'keyword', text: firstWordMatch[2] },
        { type: 'plain', text: firstWordMatch[3] }
      ];
    }
  }

  if (lang === 'toml' || lang === 'ini' || lang === 'cfg') {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith(';')) {
      return [{ type: 'comment', text: line }];
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return [{ type: 'section', text: line }];
    }
    const keyValMatch = line.match(/^(\s*)([a-zA-Z0-9_.-]+)(\s*=\s*)(.*)$/);
    if (keyValMatch) {
      return [
        { type: 'plain', text: keyValMatch[1] },
        { type: 'property', text: keyValMatch[2] },
        { type: 'operator', text: keyValMatch[3] },
        ...tokenizeGeneralValues(keyValMatch[4])
      ];
    }
  }

  if (lang === 'yaml' || lang === 'yml') {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      return [{ type: 'comment', text: line }];
    }
    const keyValMatch = line.match(/^(\s*)([-a-zA-Z0-9_]+)(\s*:\s*)(.*)$/);
    if (keyValMatch) {
      return [
        { type: 'plain', text: keyValMatch[1] },
        { type: 'property', text: keyValMatch[2] },
        { type: 'operator', text: keyValMatch[3] },
        ...tokenizeGeneralValues(keyValMatch[4])
      ];
    }
  }

  if (lang === 'json') {
    const jsonKeyMatch = line.match(/^(\s*)("([^"]+)")(\s*:\s*)(.*)$/);
    if (jsonKeyMatch) {
      return [
        { type: 'plain', text: jsonKeyMatch[1] },
        { type: 'property', text: jsonKeyMatch[2] },
        { type: 'operator', text: jsonKeyMatch[4] },
        ...tokenizeGeneralValues(jsonKeyMatch[5])
      ];
    }
  }

  if (lang === 'shell' || lang === 'bash' || lang === 'sh' || lang === 'env' || line.startsWith('.env')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      return [{ type: 'comment', text: line }];
    }
    const envMatch = line.match(/^(\s*)([a-zA-Z0-9_]+)(=)(.*)$/);
    if (envMatch) {
      return [
        { type: 'plain', text: envMatch[1] },
        { type: 'property', text: envMatch[2] },
        { type: 'operator', text: envMatch[3] },
        ...tokenizeGeneralValues(envMatch[4])
      ];
    }
  }

  // General / Python Tokenizer
  let i = 0;
  while (i < line.length) {
    // Comments
    if (line[i] === '#') {
      tokens.push({ type: 'comment', text: line.substring(i) });
      break;
    }

    // Decorators (@...)
    if (line[i] === '@' && (i === 0 || /\s/.test(line[i - 1]))) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_.]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: 'decorator', text: line.substring(i, j) });
      i = j;
      continue;
    }

    // Strings
    if (line.startsWith('"""', i) || line.startsWith("'''", i)) {
      const quote = line.substring(i, i + 3);
      const endIdx = line.indexOf(quote, i + 3);
      if (endIdx !== -1) {
        tokens.push({ type: 'string', text: line.substring(i, endIdx + 3) });
        i = endIdx + 3;
      } else {
        tokens.push({ type: 'string', text: line.substring(i) });
        break;
      }
      continue;
    }

    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      let escaped = false;
      while (j < line.length) {
        if (line[j] === '\\') {
          escaped = !escaped;
        } else if (line[j] === quote && !escaped) {
          j++;
          break;
        } else {
          escaped = false;
        }
        j++;
      }
      tokens.push({ type: 'string', text: line.substring(i, j) });
      i = j;
      continue;
    }

    // Prefixed Strings: f"...", r"...", b"..."
    if ((line[i] === 'f' || line[i] === 'r' || line[i] === 'b') && (line[i + 1] === '"' || line[i + 1] === "'")) {
      const prefix = line[i];
      const quote = line[i + 1];
      let j = i + 2;
      let escaped = false;
      while (j < line.length) {
        if (line[j] === '\\') {
          escaped = !escaped;
        } else if (line[j] === quote && !escaped) {
          j++;
          break;
        } else {
          escaped = false;
        }
        j++;
      }
      tokens.push({ type: 'keyword', text: prefix });
      tokens.push({ type: 'string', text: line.substring(i + 1, j) });
      i = j;
      continue;
    }

    // Words (Identifiers, Keywords, Builtins)
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
        j++;
      }
      const word = line.substring(i, j);

      // Check if previous token was 'def' or 'class'
      const prevToken = tokens.filter(t => t.type !== 'plain' || t.text.trim() !== '').pop();
      if (prevToken && prevToken.text === 'def') {
        tokens.push({ type: 'function', text: word });
      } else if (prevToken && prevToken.text === 'class') {
        tokens.push({ type: 'class', text: word });
      } else if (PYTHON_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (PYTHON_BUILTINS.has(word)) {
        tokens.push({ type: 'builtin', text: word });
      } else if (SHELL_COMMANDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (j < line.length && line[j] === '(') {
        // Function call
        tokens.push({ type: 'function', text: word });
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        // Class/Type Name PascalCase
        tokens.push({ type: 'class', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[0-9.xXbBeEfFa-f]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: 'number', text: line.substring(i, j) });
      i = j;
      continue;
    }

    // Operators and Symbols
    if (/[+\-*/%=<>!&|^~:]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[+\-*/%=<>!&|^~:]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: 'operator', text: line.substring(i, j) });
      i = j;
      continue;
    }

    // Single character (spaces, parentheses, brackets, commas, etc.)
    tokens.push({ type: 'plain', text: line[i] });
    i++;
  }

  return tokens;
}

function tokenizeGeneralValues(val: string): Token[] {
  const trimmed = val.trim();
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return [{ type: 'string', text: val }];
  }
  if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null' || trimmed === 'True' || trimmed === 'False' || trimmed === 'None') {
    return [{ type: 'boolean', text: val }];
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return [{ type: 'number', text: val }];
  }
  return [{ type: 'plain', text: val }];
}

export function CodeHighlighter({
  code,
  language = 'python',
  theme = 'light',
  showLineNumbers = true,
  highlightedLine = null,
  onLineClick,
  className = ''
}: CodeHighlighterProps) {
  const lines = useMemo(() => code.split('\n'), [code]);

  // Color mappings for Light and Dark modes
  const isDark = theme === 'dark';

  const getColorClass = (type: TokenType): string => {
    if (isDark) {
      switch (type) {
        case 'keyword': return 'text-purple-400 font-semibold';
        case 'decorator': return 'text-orange-400 font-medium';
        case 'function': return 'text-sky-300 font-semibold';
        case 'class': return 'text-emerald-300 font-bold';
        case 'builtin': return 'text-cyan-300 font-medium';
        case 'string': return 'text-emerald-400';
        case 'comment': return 'text-slate-400 italic';
        case 'number': return 'text-amber-300';
        case 'boolean': return 'text-amber-400 font-semibold';
        case 'operator': return 'text-pink-400';
        case 'property': return 'text-blue-300 font-medium';
        case 'section': return 'text-yellow-300 font-bold';
        case 'heading': return 'text-indigo-300 font-bold';
        default: return 'text-slate-100';
      }
    } else {
      switch (type) {
        case 'keyword': return 'text-purple-700 font-semibold';
        case 'decorator': return 'text-orange-600 font-medium';
        case 'function': return 'text-blue-700 font-semibold';
        case 'class': return 'text-emerald-700 font-bold';
        case 'builtin': return 'text-cyan-700 font-medium';
        case 'string': return 'text-green-700';
        case 'comment': return 'text-slate-500 italic';
        case 'number': return 'text-amber-700';
        case 'boolean': return 'text-amber-700 font-semibold';
        case 'operator': return 'text-pink-700';
        case 'property': return 'text-sky-700 font-medium';
        case 'section': return 'text-purple-800 font-bold';
        case 'heading': return 'text-indigo-800 font-bold';
        default: return 'text-slate-900';
      }
    }
  };

  return (
    <div className={`font-mono text-xs leading-6 select-text flex min-w-full ${className}`}>
      {/* Line Numbers Column */}
      {showLineNumbers && (
        <div 
          className={`shrink-0 text-right pr-4 pl-3 py-3 select-none border-r transition-colors ${
            isDark 
              ? 'bg-[#181818]/90 text-slate-500 border-slate-800' 
              : 'bg-slate-100/90 text-slate-400 border-slate-200'
          }`}
          style={{ width: `${Math.max(3, String(lines.length).length) * 10 + 28}px` }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isTarget = highlightedLine === lineNum;
            return (
              <div
                key={i}
                onClick={() => onLineClick && onLineClick(lineNum)}
                className={`cursor-pointer transition-colors ${
                  isTarget
                    ? isDark ? 'text-orange-400 font-bold' : 'text-orange-600 font-bold'
                    : isDark ? 'hover:text-slate-300' : 'hover:text-slate-700'
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>
      )}

      {/* Code Text Content */}
      <div 
        className={`flex-1 py-3 px-4 overflow-x-auto transition-colors ${
          isDark ? 'bg-[#1e1e1e] text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isTarget = highlightedLine === lineNum;
          const tokens = tokenizeLine(line, language);

          return (
            <div
              key={idx}
              onClick={() => onLineClick && onLineClick(lineNum)}
              className={`whitespace-pre px-1.5 rounded transition-colors ${
                isTarget
                  ? isDark 
                    ? 'bg-orange-500/20 border-l-2 border-orange-500' 
                    : 'bg-orange-50 border-l-2 border-orange-500'
                  : isDark 
                    ? 'hover:bg-slate-800/40' 
                    : 'hover:bg-slate-50'
              }`}
            >
              {tokens.length === 0 ? (
                <span>&nbsp;</span>
              ) : (
                tokens.map((tok, tIdx) => (
                  <span key={tIdx} className={getColorClass(tok.type)}>
                    {tok.text}
                  </span>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
