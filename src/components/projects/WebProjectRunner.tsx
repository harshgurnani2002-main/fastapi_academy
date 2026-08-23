'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Play, RefreshCw, Send, Copy, Check, ExternalLink, ArrowLeft,
  Server, Shield, Database, Sparkles, Terminal, Code, Sun, Moon,
  FileCode, Layers, CheckCircle2, ChevronDown, ChevronRight, X, Download
} from 'lucide-react';
import { ProjectData } from '@/lib/content/projectsData';
import { CodeHighlighter } from './CodeHighlighter';

interface WebProjectRunnerProps {
  projectData: ProjectData;
  zipUrl: string;
}

interface EndpointExecutionState {
  isTrying: boolean;
  requestBody: string;
  queryParams: Record<string, string>;
  isLoading: boolean;
  response: {
    status: number;
    timeMs: number;
    correlationId: string;
    headers: Record<string, string>;
    data: any;
    curlCmd: string;
  } | null;
}

export function WebProjectRunner({ projectData, zipUrl }: WebProjectRunnerProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'docs' | 'redoc' | 'client' | 'openapi'>('docs');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Server state
  const [serverOnline, setServerOnline] = useState(true);
  const [serverLogs, setServerLogs] = useState<string[]>([
    `[${new Date().toISOString()}] INFO:     Started server process [18920]`,
    `[${new Date().toISOString()}] INFO:     Waiting for application startup...`,
    `[${new Date().toISOString()}] INFO:     [system] Database connection pool initialized.`,
    `[${new Date().toISOString()}] INFO:     [system] Registered ${projectData.endpoints.length} API route handlers.`,
    `[${new Date().toISOString()}] INFO:     Application startup complete. Uvicorn running on http://127.0.0.1:8000`,
    `[${new Date().toISOString()}] INFO:     Swagger UI documentation ready at http://127.0.0.1:8000/docs`,
  ]);

  // Per-endpoint execution states
  const [execStates, setExecStates] = useState<Record<number, EndpointExecutionState>>(() => {
    const initial: Record<number, EndpointExecutionState> = {};
    projectData.endpoints.forEach((ep, idx) => {
      initial[idx] = {
        isTrying: false,
        requestBody: ep.requestBody ? JSON.stringify(ep.requestBody, null, 2) : '',
        queryParams: {},
        isLoading: false,
        response: null,
      };
    });
    return initial;
  });

  // Client Playground State
  const [clientMethod, setClientMethod] = useState(projectData.endpoints[0]?.method || 'GET');
  const [clientPath, setClientPath] = useState(projectData.endpoints[0]?.path || '/api/v1/health');
  const [clientBody, setClientBody] = useState(
    projectData.endpoints[0]?.requestBody ? JSON.stringify(projectData.endpoints[0].requestBody, null, 2) : ''
  );
  const [clientLoading, setClientLoading] = useState(false);
  const [clientResponse, setClientResponse] = useState<any>(null);

  const isDark = theme === 'dark';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEndpointAccordion = (idx: number) => {
    setExpandedEndpoints(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleTryItOut = (idx: number) => {
    setExecStates(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        isTrying: !prev[idx]?.isTrying,
      }
    }));
  };

  const handleExecuteEndpoint = (idx: number) => {
    const ep = projectData.endpoints[idx];
    if (!ep) return;

    setExecStates(prev => ({
      ...prev,
      [idx]: { ...prev[idx], isLoading: true }
    }));

    setTimeout(() => {
      const state = execStates[idx];
      let parsedBody = null;
      let isValidationError = false;

      if ((ep.method === 'POST' || ep.method === 'PUT') && state.requestBody.trim()) {
        try {
          parsedBody = JSON.parse(state.requestBody);
        } catch {
          isValidationError = true;
        }
      }

      const latency = Math.floor(Math.random() * 20) + 8;
      const cid = 'req_' + Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString();

      let statusCode = ep.status || 200;
      let responsePayload = ep.responseBody;

      if (isValidationError) {
        statusCode = 422;
        responsePayload = {
          success: false,
          error: {
            code: 'REQUEST_VALIDATION_ERROR',
            message: 'Invalid JSON payload provided in request body.',
            details: [{ location: 'body', message: 'JSON decode error' }],
            correlation_id: cid
          }
        };
      } else if (parsedBody && (ep.method === 'POST' || ep.method === 'PUT')) {
        responsePayload = {
          ...ep.responseBody,
          data: {
            ...(ep.responseBody?.data || {}),
            ...parsedBody
          }
        };
      }

      // Generate curl
      let curl = `curl -X '${ep.method}' \\\n  'http://localhost:8000${ep.path}' \\\n  -H 'accept: application/json'`;
      if (parsedBody) {
        curl += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(parsedBody)}'`;
      }

      const result = {
        status: statusCode,
        timeMs: latency,
        correlationId: cid,
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': cid,
          'x-process-time': `${latency.toFixed(2)}ms`,
          'server': 'uvicorn / fastapi',
          'date': new Date().toUTCString(),
        },
        data: responsePayload,
        curlCmd: curl
      };

      setExecStates(prev => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          isLoading: false,
          response: result
        }
      }));

      // Add to server logs
      const logLine = `${timestamp} | INFO | [${cid}] | ${ep.method} ${ep.path} -> ${statusCode} (${latency.toFixed(2)}ms)`;
      setServerLogs(prev => [logLine, ...prev.slice(0, 40)]);
    }, 400);
  };

  const handleClientSend = () => {
    setClientLoading(true);
    setTimeout(() => {
      const match = projectData.endpoints.find(e => e.path === clientPath && e.method === clientMethod) 
        || projectData.endpoints[0];

      let parsed = null;
      if ((clientMethod === 'POST' || clientMethod === 'PUT') && clientBody.trim()) {
        try {
          parsed = JSON.parse(clientBody);
        } catch {
          // ignore
        }
      }

      const latency = Math.floor(Math.random() * 22) + 9;
      const cid = 'req_' + Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString();

      const resp = {
        status: match ? match.status : 200,
        timeMs: latency,
        correlationId: cid,
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': cid,
          'x-process-time': `${latency.toFixed(2)}ms`,
          'server': 'uvicorn',
        },
        data: parsed && match?.responseBody ? {
          ...match.responseBody,
          data: { ...(match.responseBody.data || {}), ...parsed }
        } : (match?.responseBody || { message: "OK" })
      };

      setClientResponse(resp);
      setClientLoading(false);

      const logLine = `${timestamp} | INFO | [${cid}] | ${clientMethod} ${clientPath} -> ${resp.status} (${latency.toFixed(2)}ms)`;
      setServerLogs(prev => [logLine, ...prev.slice(0, 40)]);
    }, 350);
  };

  // Group endpoints by tag / prefix
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, Array<{ ep: typeof projectData.endpoints[0]; originalIndex: number }>> = {};
    projectData.endpoints.forEach((ep, idx) => {
      const parts = ep.path.replace(/^\/api\/v1\//, '').split('/');
      const tag = parts[0] ? parts[0].toUpperCase() : 'DEFAULT';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push({ ep, originalIndex: idx });
    });
    return groups;
  }, [projectData.endpoints]);

  // Generate complete OpenAPI 3.1.0 spec JSON
  const openApiSpec = useMemo(() => {
    const paths: Record<string, any> = {};
    projectData.endpoints.forEach(ep => {
      if (!paths[ep.path]) paths[ep.path] = {};
      const methodKey = ep.method.toLowerCase();
      paths[ep.path][methodKey] = {
        summary: ep.description,
        tags: [ep.path.split('/')[3] || 'default'],
        responses: {
          [String(ep.status)]: {
            description: "Successful Response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  example: ep.responseBody
                }
              }
            }
          },
          "422": {
            description: "Validation Error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    detail: { type: "array", items: { type: "object" } }
                  }
                }
              }
            }
          }
        },
        ...(ep.requestBody ? {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  example: ep.requestBody
                }
              }
            }
          }
        } : {})
      };
    });

    return {
      openapi: "3.1.0",
      info: {
        title: projectData.title,
        version: "1.0.0",
        description: projectData.description
      },
      servers: [
        { url: "http://localhost:8000", description: "Development Server (FastAPI Live Runtime)" }
      ],
      paths
    };
  }, [projectData]);

  const getMethodBadgeStyle = (method: string) => {
    switch (method) {
      case 'GET':
        return isDark 
          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
          : 'bg-blue-100 text-blue-800 border-blue-300';
      case 'POST':
        return isDark 
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PUT':
        return isDark 
          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
          : 'bg-orange-100 text-orange-800 border-orange-300';
      case 'DELETE':
        return isDark 
          ? 'bg-red-500/20 text-red-400 border-red-500/40' 
          : 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-200 text-slate-800 border-slate-300';
    }
  };

  const getMethodAccordionBorder = (method: string) => {
    switch (method) {
      case 'GET':
        return isDark ? 'border-blue-500/30 bg-blue-950/10' : 'border-blue-200 bg-blue-50/40';
      case 'POST':
        return isDark ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-emerald-200 bg-emerald-50/40';
      case 'PUT':
        return isDark ? 'border-orange-500/30 bg-orange-950/10' : 'border-orange-200 bg-orange-50/40';
      case 'DELETE':
        return isDark ? 'border-red-500/30 bg-red-950/10' : 'border-red-200 bg-red-50/40';
      default:
        return 'border-slate-300 bg-slate-50';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      isDark ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. Top Navbar / FastAPI App Bar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-6 py-3 transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <Link 
              href={`/projects/${projectData.slug}`} 
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Back to Project details"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30">
                F
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-extrabold text-base sm:text-lg leading-tight truncate">{projectData.title}</h1>
                  <span className="bg-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
                    OAS 3.1.0
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs opacity-70">
                  <span>FastAPI Virtual ASGI Web Runner</span>
                  <span>•</span>
                  <span>Chapter {projectData.chapterId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Views & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Tabs */}
            <div className={`p-1 rounded-xl border flex items-center space-x-1 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'docs' 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Swagger UI (/docs)
              </button>
              <button
                onClick={() => setActiveTab('client')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'client' 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                API Playground
              </button>
              <button
                onClick={() => setActiveTab('openapi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'openapi' 
                    ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OpenAPI JSON
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Back to Project IDE */}
            <Link
              href={`/projects/${projectData.slug}`}
              className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-orange-500/20 flex items-center gap-1.5"
            >
              <Code className="w-3.5 h-3.5" />
              <span>VS Code Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Server Status Banner */}
      <div className={`border-b px-6 py-2.5 text-xs transition-colors ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-emerald-600">ASGI Server Online</span>
            </div>
            <span>•</span>
            <span className="font-mono opacity-80">http://127.0.0.1:8000</span>
            <span>•</span>
            <span className="opacity-80">Uvicorn 0.27 (Python 3.12)</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-bold">{projectData.endpoints.length} Endpoints Ready</span>
            <span>•</span>
            <a
              href={zipUrl}
              download
              className="font-semibold text-orange-600 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download Source Code
            </a>
          </div>
        </div>
      </div>

      {/* 3. Main Content Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* VIEW 1: SWAGGER UI INTERACTIVE DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-8">
            
            {/* Swagger Header Banner */}
            <div className={`p-6 rounded-3xl border shadow-xl transition-colors ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded text-xs tracking-wider uppercase">
                      FastAPI
                    </span>
                    <span className="text-xs font-bold opacity-70">v1.0.0</span>
                    <span className="text-xs bg-slate-500/20 px-2 py-0.5 rounded font-mono">[openapi.json]</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black mb-2">{projectData.title}</h2>
                  <p className={`text-sm leading-relaxed max-w-3xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {projectData.description}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-start md:items-end gap-2 text-xs">
                  <div className={`px-3 py-1.5 rounded-lg border font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
                  }`}>
                    Servers: <strong className="text-emerald-500">http://localhost:8000</strong>
                  </div>
                  <span className="opacity-60 text-[11px]">Authorize: None required (mock session)</span>
                </div>
              </div>
            </div>

            {/* Endpoints by Tag / Group */}
            <div className="space-y-6">
              {Object.entries(groupedEndpoints).map(([tag, items]) => (
                <div key={tag} className="space-y-3">
                  <div className="flex items-center space-x-2 border-b pb-2 pt-2">
                    <h3 className="text-lg font-black tracking-wide text-orange-500">{tag}</h3>
                    <span className="text-xs opacity-60 font-semibold">({items.length} routes)</span>
                  </div>

                  <div className="space-y-3">
                    {items.map(({ ep, originalIndex }) => {
                      const isExpanded = expandedEndpoints[originalIndex] ?? false;
                      const execState = execStates[originalIndex];

                      return (
                        <div
                          key={originalIndex}
                          className={`rounded-2xl border transition-all overflow-hidden shadow-sm ${getMethodAccordionBorder(ep.method)}`}
                        >
                          {/* Accordion Bar */}
                          <div 
                            onClick={() => toggleEndpointAccordion(originalIndex)}
                            className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                              isDark ? 'hover:bg-slate-800/40' : 'hover:bg-white/80'
                            }`}
                          >
                            <div className="flex items-center space-x-3 truncate">
                              <span className={`px-3 py-1 text-xs font-black rounded-lg border uppercase tracking-wider ${getMethodBadgeStyle(ep.method)}`}>
                                {ep.method}
                              </span>
                              <span className="font-mono text-sm sm:text-base font-bold truncate">
                                {ep.path}
                              </span>
                              <span className={`hidden md:inline text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                — {ep.description}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 ml-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 shadow-xs'
                              }`}>
                                {ep.status} OK
                              </span>
                              <span className="text-slate-400">
                                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Endpoint Body */}
                          {isExpanded && (
                            <div className={`p-4 sm:p-6 border-t space-y-6 ${
                              isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-slate-200'
                            }`}>
                              
                              {/* Description & Action */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/40">
                                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {ep.description}
                                </p>
                                
                                <button
                                  onClick={() => toggleTryItOut(originalIndex)}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                                    execState?.isTrying
                                      ? 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {execState?.isTrying ? 'Cancel' : '⚡ Try it out'}
                                </button>
                              </div>

                              {/* Request Body Payload Editor (if POST/PUT) */}
                              {(ep.method === 'POST' || ep.method === 'PUT') && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                      Request Body (application/json)
                                    </h4>
                                    <span className="text-[11px] text-emerald-600 font-semibold">required</span>
                                  </div>

                                  {execState?.isTrying ? (
                                    <textarea
                                      value={execState.requestBody}
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        setExecStates(prev => ({
                                          ...prev,
                                          [originalIndex]: { ...prev[originalIndex], requestBody: text }
                                        }));
                                      }}
                                      rows={5}
                                      className={`w-full font-mono text-xs p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                        isDark ? 'bg-slate-950 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-800'
                                      }`}
                                    />
                                  ) : (
                                    <div className="rounded-xl overflow-hidden border border-slate-200/50">
                                      <CodeHighlighter
                                        code={JSON.stringify(ep.requestBody || {}, null, 2)}
                                        language="json"
                                        theme={theme}
                                        showLineNumbers={false}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Execute Button */}
                              {execState?.isTrying && (
                                <div className="pt-2">
                                  <button
                                    onClick={() => handleExecuteEndpoint(originalIndex)}
                                    disabled={execState.isLoading}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20"
                                  >
                                    {execState.isLoading ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-white" />
                                    )}
                                    <span>{execState.isLoading ? 'Sending to FastAPI...' : 'Execute Request'}</span>
                                  </button>
                                </div>
                              )}

                              {/* Live Server Response Box */}
                              {execState?.response && (
                                <div className={`p-4 rounded-2xl border space-y-4 ${
                                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs font-black uppercase text-slate-400">Server Response</span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                        execState.response.status < 300 
                                          ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
                                          : 'bg-red-500/20 text-red-600 border border-red-500/30'
                                      }`}>
                                        Code: {execState.response.status}
                                      </span>
                                      <span className="text-xs font-mono opacity-80">⚡ {execState.response.timeMs}ms</span>
                                    </div>

                                    <button
                                      onClick={() => copyToClipboard(JSON.stringify(execState.response?.data, null, 2), `res-${originalIndex}`)}
                                      className="text-xs text-slate-400 hover:text-emerald-500 flex items-center gap-1"
                                    >
                                      {copiedId === `res-${originalIndex}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>Copy</span>
                                    </button>
                                  </div>

                                  {/* Curl command snippet */}
                                  <div>
                                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Generated Curl</span>
                                    <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto whitespace-pre">
                                      {execState.response.curlCmd}
                                    </div>
                                  </div>

                                  {/* Response Body */}
                                  <div>
                                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Response Body</span>
                                    <div className="rounded-xl overflow-hidden border border-slate-200/50">
                                      <CodeHighlighter
                                        code={JSON.stringify(execState.response.data, null, 2)}
                                        language="json"
                                        theme={theme}
                                        showLineNumbers={false}
                                      />
                                    </div>
                                  </div>

                                  {/* Response Headers */}
                                  <div>
                                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Response Headers</span>
                                    <div className="p-2.5 rounded-lg bg-slate-900/80 text-slate-300 font-mono text-[11px] space-y-0.5">
                                      {Object.entries(execState.response.headers).map(([k, v]) => (
                                        <div key={k}><span className="text-orange-400">{k}:</span> {v}</div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Schema Models View (Responses) */}
                              <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Default Response Schema ({ep.status} OK)
                                </h4>
                                <div className="rounded-xl overflow-hidden border border-slate-200/50">
                                  <CodeHighlighter
                                    code={JSON.stringify(ep.responseBody, null, 2)}
                                    language="json"
                                    theme={theme}
                                    showLineNumbers={false}
                                  />
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 2: LIVE API PLAYGROUND (POSTMAN STYLE) */}
        {activeTab === 'client' && (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Request Builder */}
            <div className="lg:col-span-7 space-y-6">
              <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Send className="w-5 h-5 text-orange-500" />
                  <span>Interactive API Request Builder</span>
                </h3>

                {/* Method & URL Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={clientMethod}
                    onChange={(e) => setClientMethod(e.target.value as any)}
                    className={`px-3 py-2.5 rounded-xl font-bold text-xs border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>

                  <select
                    value={clientPath}
                    onChange={(e) => {
                      const newPath = e.target.value;
                      setClientPath(newPath);
                      const match = projectData.endpoints.find(ep => ep.path === newPath);
                      if (match) {
                        setClientMethod(match.method);
                        setClientBody(match.requestBody ? JSON.stringify(match.requestBody, null, 2) : '');
                      }
                    }}
                    className={`flex-1 px-3 py-2.5 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                  >
                    {projectData.endpoints.map((ep, i) => (
                      <option key={i} value={ep.path}>
                        {ep.method} {ep.path} ({ep.description})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleClientSend}
                    disabled={clientLoading}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 shrink-0"
                  >
                    {clientLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send</span>
                  </button>
                </div>

                {/* Request Payload for POST/PUT */}
                {(clientMethod === 'POST' || clientMethod === 'PUT') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      JSON Payload Body
                    </label>
                    <textarea
                      value={clientBody}
                      onChange={(e) => setClientBody(e.target.value)}
                      rows={6}
                      className={`w-full font-mono text-xs p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark ? 'bg-slate-950 border-slate-700 text-emerald-400' : 'bg-slate-50 border-slate-300 text-emerald-800 font-semibold'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Endpoint Preset Quick-Select */}
              <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pre-configured Project Routes
                </h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {projectData.endpoints.map((ep, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setClientMethod(ep.method);
                        setClientPath(ep.path);
                        setClientBody(ep.requestBody ? JSON.stringify(ep.requestBody, null, 2) : '');
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        clientPath === ep.path && clientMethod === ep.method
                          ? 'border-orange-500 bg-orange-500/10 font-bold'
                          : isDark ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] mr-1.5 font-bold ${getMethodBadgeStyle(ep.method)}`}>
                          {ep.method}
                        </span>
                        <span className="font-mono">{ep.path}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Response Inspector */}
            <div className="lg:col-span-5 space-y-6">
              <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-500" />
                    <span>Response Inspector</span>
                  </h3>

                  {clientResponse && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                      {clientResponse.status} OK • {clientResponse.timeMs}ms
                    </span>
                  )}
                </div>

                {clientResponse ? (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border border-slate-200/50">
                      <CodeHighlighter
                        code={JSON.stringify(clientResponse.data, null, 2)}
                        language="json"
                        theme={theme}
                        showLineNumbers={true}
                      />
                    </div>

                    <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>x-correlation-id: <span className="font-bold text-orange-500">{clientResponse.correlationId}</span></div>
                      <div>x-process-time: <span className="font-bold">{clientResponse.headers['x-process-time']}</span></div>
                      <div>content-type: application/json</div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    Click <strong>Send</strong> to execute an API call and inspect response payload.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: OPENAPI 3.1.0 SPEC (JSON) */}
        {activeTab === 'openapi' && (
          <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-black">OpenAPI 3.1.0 JSON Specification</h3>
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(openApiSpec, null, 2), 'openapi')}
                className="px-4 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {copiedId === 'openapi' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'openapi' ? 'Copied Spec' : 'Copy Spec JSON'}</span>
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200/50">
              <CodeHighlighter
                code={JSON.stringify(openApiSpec, null, 2)}
                language="json"
                theme={theme}
                showLineNumbers={true}
              />
            </div>
          </div>
        )}

      </main>

      {/* 4. Live Server Console Logs Terminal (Bottom Dock) */}
      <footer className="border-t bg-[#0a0f1d] text-slate-300 font-mono text-xs border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">Uvicorn ASGI Server Console Logs</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Live Stream</span>
          </div>

          <button
            onClick={() => setServerLogs([`[${new Date().toISOString()}] INFO: Server logs cleared.`])}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Clear Console
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-3 h-32 overflow-y-auto space-y-1 text-[11px] scrollbar-thin">
          {serverLogs.map((log, i) => (
            <div key={i} className="leading-5 text-slate-300">
              {log.includes('-> 200') || log.includes('-> 201') ? (
                <span className="text-emerald-400">{log}</span>
              ) : log.includes('-> 422') || log.includes('-> 500') ? (
                <span className="text-red-400">{log}</span>
              ) : log.includes('INFO:') || log.includes('startup') ? (
                <span className="text-sky-300">{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
        </div>
      </footer>

    </div>
  );
}
