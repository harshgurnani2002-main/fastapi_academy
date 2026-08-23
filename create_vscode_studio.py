studio_code = ''''use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileCode, FileText, Download, Play, CheckCircle2, 
  Terminal, Layers, Globe, Search, Copy, Check, ChevronRight, ChevronDown,
  Maximize2, Minimize2, RefreshCw, X, Server, Shield, Database, Send, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { ProjectData } from '@/lib/content/projectsData';

interface VSCodeStudioProps {
  projectData: ProjectData;
  zipUrl: string;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  language?: string;
  lineCount?: number;
}

export function VSCodeStudio({ projectData, zipUrl }: VSCodeStudioProps) {
  // Navigation & View States
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'api' | 'tests' | 'arch'>('explorer');
  const [activeFile, setActiveFile] = useState<string>(projectData.defaultFile || 'src/main.py');
  const [openTabs, setOpenTabs] = useState<string[]>([projectData.defaultFile || 'src/main.py']);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/api': true,
    'src/api/v1': true,
    'src/core': true,
    'src/domain': true,
    'src/repositories': true,
    'src/schemas': true,
    'src/services': true,
    'src/db': true,
    'tests': true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Terminal & Panel States
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomTab, setBottomTab] = useState<'terminal' | 'test-output' | 'server-logs'>('test-output');
  
  // Test Runner State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testRunProgress, setTestRunProgress] = useState(100);
  const [testResults, setTestResults] = useState(projectData.tests || []);

  // API Playground State
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [requestBodyText, setRequestBodyText] = useState(
    projectData.endpoints[0]?.requestBody ? JSON.stringify(projectData.endpoints[0].requestBody, null, 2) : ''
  );
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(
    projectData.endpoints[0] ? {
      status: projectData.endpoints[0].status,
      timeMs: 14,
      correlationId: 'req_8f3a1290b',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': 'req_8f3a1290b',
        'x-process-time': '14.22ms'
      },
      data: projectData.endpoints[0].responseBody
    } : null
  );

  // Update endpoint body when endpoint changes
  const activeEndpoint = projectData.endpoints[selectedEndpointIndex] || projectData.endpoints[0];
  useEffect(() => {
    if (activeEndpoint) {
      setRequestBodyText(activeEndpoint.requestBody ? JSON.stringify(activeEndpoint.requestBody, null, 2) : '');
      setLastResponse({
        status: activeEndpoint.status,
        timeMs: Math.floor(Math.random() * 15) + 8,
        correlationId: 'req_' + Math.random().toString(36).substring(2, 11),
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': 'req_' + Math.random().toString(36).substring(2, 11),
          'x-process-time': `${(Math.random() * 12 + 4).toFixed(2)}ms`
        },
        data: activeEndpoint.responseBody
      });
    }
  }, [selectedEndpointIndex, activeEndpoint]);

  // Open a file tab
  const handleOpenFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
    setActiveFile(path);
  };

  // Close a file tab
  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (activeFile === path && newTabs.length > 0) {
      setActiveFile(newTabs[newTabs.length - 1]);
    }
  };

  // Copy active file code
  const handleCopyCode = () => {
    const file = projectData.files[activeFile];
    if (file) {
      navigator.clipboard.writeText(file.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Toggle folder open/close
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Run tests animation
  const handleRunTests = () => {
    setIsRunningTests(true);
    setTestRunProgress(0);
    setBottomTab('test-output');
    setShowBottomPanel(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setTestRunProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsRunningTests(false);
      }
    }, 80);
  };

  // Send API request in playground
  const handleSendApiRequest = () => {
    setIsSendingRequest(true);
    setTimeout(() => {
      const isPostOrPut = activeEndpoint.method === 'POST' || activeEndpoint.method === 'PUT';
      let parsedBody = null;
      let errorOccurred = false;

      if (isPostOrPut && requestBodyText.trim()) {
        try {
          parsedBody = JSON.parse(requestBodyText);
        } catch (e) {
          errorOccurred = true;
        }
      }

      const randomLatency = Math.floor(Math.random() * 18) + 9;
      const cid = 'req_' + Math.random().toString(36).substring(2, 11);

      if (errorOccurred) {
        setLastResponse({
          status: 422,
          timeMs: 4,
          correlationId: cid,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': cid,
            'x-process-time': '4.10ms'
          },
          data: {
            success: false,
            error: {
              code: 'REQUEST_VALIDATION_ERROR',
              message: 'Invalid JSON payload provided in request body.',
              details: [{ location: 'body', message: 'JSON decode error' }]
            }
          }
        });
      } else {
        setLastResponse({
          status: activeEndpoint.status,
          timeMs: randomLatency,
          correlationId: cid,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': cid,
            'x-process-time': `${randomLatency.toFixed(2)}ms`
          },
          data: isPostOrPut && parsedBody ? {
            ...activeEndpoint.responseBody,
            data: {
              ...(activeEndpoint.responseBody.data || {}),
              ...parsedBody
            }
          } : activeEndpoint.responseBody
        });
      }
      setIsSendingRequest(false);
    }, 350);
  };

  // Build File Tree structure
  const fileTree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

    Object.entries(projectData.files).forEach(([filePath, fileInfo]) => {
      if (searchQuery && !filePath.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      const parts = filePath.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (!current.children) current.children = [];
        let existing = current.children.find(c => c.name === part);

        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            isFolder: !isFile,
            children: isFile ? undefined : [],
            language: isFile ? fileInfo.language : undefined,
            lineCount: isFile ? fileInfo.code.split('\\n').length : undefined
          };
          current.children.push(existing);
        }
        current = existing;
      });
    });

    // Sort folders first then alphabetical
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
        return a.isFolder ? -1 : 1;
      });
      nodes.forEach(n => {
        if (n.children) sortNodes(n.children);
      });
    };

    if (root.children) sortNodes(root.children);
    return root.children || [];
  }, [projectData.files, searchQuery]);

  // Helper for File Icon
  const getFileIcon = (fileName: string, language?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'py') return <span className="text-blue-400 font-bold text-xs font-mono">py</span>;
    if (ext === 'json') return <span className="text-yellow-400 font-bold text-xs font-mono">{'{}'}</span>;
    if (ext === 'toml' || ext === 'ini') return <span className="text-emerald-400 font-bold text-xs font-mono">⚙</span>;
    if (ext === 'md') return <span className="text-orange-400 font-bold text-xs font-mono">M↓</span>;
    if (ext === 'yml' || ext === 'yaml') return <span className="text-purple-400 font-bold text-xs font-mono">Y</span>;
    if (fileName.toLowerCase() === 'dockerfile') return <span className="text-cyan-400 font-bold text-xs font-mono">🐳</span>;
    if (ext === 'example' || fileName.startsWith('.env')) return <span className="text-slate-400 font-bold text-xs font-mono">env</span>;
    return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
  };

  // Render tree item recursively
  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return (
      <div className="space-y-0.5 select-none">
        {nodes.map(node => {
          if (node.isFolder) {
            const isExpanded = expandedFolders[node.path] ?? false;
            return (
              <div key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  style={{ paddingLeft: `${depth * 14 + 10}px` }}
                  className="w-full flex items-center py-1 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white rounded transition-colors group"
                >
                  <span className="text-slate-500 group-hover:text-slate-300 mr-1.5 transition-transform">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-orange-400 mr-1.5">
                    {isExpanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                  </span>
                  <span className="font-medium truncate">{node.name}</span>
                </button>
                {isExpanded && node.children && renderTree(node.children, depth + 1)}
              </div>
            );
          }

          const isSelected = activeFile === node.path;
          return (
            <button
              key={node.path}
              onClick={() => handleOpenFile(node.path)}
              style={{ paddingLeft: `${depth * 14 + 26}px` }}
              className={`w-full flex items-center justify-between py-1 text-xs rounded transition-colors ${
                isSelected 
                  ? 'bg-orange-500/20 text-orange-400 font-semibold border-l-2 border-orange-500 pl-[24px]' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="shrink-0">{getFileIcon(node.name, node.language)}</span>
                <span className="truncate">{node.name}</span>
              </div>
              {node.lineCount && (
                <span className="text-[10px] text-slate-600 mr-2 shrink-0">{node.lineCount}L</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const currentFileContent = projectData.files[activeFile]?.code || '# Select a file from the explorer';
  const fileLines = currentFileContent.split('\\n');

  return (
    <div className={`flex flex-col bg-[#1e1e1e] text-slate-200 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-[760px] my-6'
    }`}>
      
      {/* 1. VS Code Top Window Header */}
      <div className="bg-[#181818] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between select-none">
        {/* Left Mac Window Dots + Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-600"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-600"></div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span className="text-orange-400 font-bold">{projectData.slug}</span>
            <span>›</span>
            <span className="text-slate-300">{activeFile}</span>
          </div>
        </div>

        {/* Center Title */}
        <div className="text-xs font-semibold text-slate-300 tracking-wide flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>FastAPI Studio • Chapter {projectData.chapterId}</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-semibold transition-colors"
          >
            {isRunningTests ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
            <span>Run Tests (13)</span>
          </button>

          <a
            href={zipUrl}
            download
            className="flex items-center space-x-1.5 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded text-xs font-bold transition-all shadow-md shadow-orange-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .zip</span>
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Main Studio Workspace (Activity Bar + Sidebar + Editor) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Leftmost Activity Bar */}
        <div className="w-12 bg-[#121212] border-r border-slate-800 flex flex-col items-center py-3 space-y-4 shrink-0 select-none">
          <button
            onClick={() => setActiveSidebarTab('explorer')}
            title="File Explorer (Cmd+Shift+E)"
            className={`p-2 rounded-lg transition-colors relative ${
              activeSidebarTab === 'explorer' 
                ? 'text-orange-400 bg-slate-800/80' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            <FileCode className="w-5 h-5" />
            {activeSidebarTab === 'explorer' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('api')}
            title="Interactive API Playground"
            className={`p-2 rounded-lg transition-colors relative ${
              activeSidebarTab === 'api' 
                ? 'text-orange-400 bg-slate-800/80' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-5 h-5" />
            {activeSidebarTab === 'api' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('tests')}
            title="Pytest Test Suite Runner"
            className={`p-2 rounded-lg transition-colors relative ${
              activeSidebarTab === 'tests' 
                ? 'text-orange-400 bg-slate-800/80' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {activeSidebarTab === 'tests' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('arch')}
            title="Clean Architecture Layer Map"
            className={`p-2 rounded-lg transition-colors relative ${
              activeSidebarTab === 'arch' 
                ? 'text-orange-400 bg-slate-800/80' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-5 h-5" />
            {activeSidebarTab === 'arch' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-r"></span>
            )}
          </button>
        </div>

        {/* Primary Sidebar Content */}
        <div className="w-72 bg-[#181818] border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
          
          {/* TAB 1: File Explorer */}
          {activeSidebarTab === 'explorer' && (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Explorer</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                  {Object.keys(projectData.files).length} files
                </span>
              </div>

              {/* Search filter input */}
              <div className="p-2 border-b border-slate-800/60">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter files (e.g. users, repo)..."
                    className="w-full bg-[#121212] border border-slate-700/80 rounded px-2 pl-8 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 text-slate-500 hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tree View */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
                {renderTree(fileTree)}
              </div>
            </div>
          )}

          {/* TAB 2: Interactive API Playground */}
          {activeSidebarTab === 'api' && (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">API Endpoints</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                  FastAPI v1
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {projectData.endpoints.map((ep, idx) => {
                  const isSelected = selectedEndpointIndex === idx;
                  const methodColors: Record<string, string> = {
                    GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
                  };

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedEndpointIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        isSelected 
                          ? 'bg-slate-800/90 border-orange-500/50 shadow-md' 
                          : 'bg-[#121212]/60 border-slate-800 hover:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${methodColors[ep.method]}`}>
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-200 truncate">{ep.path}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{ep.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Pytest Runner */}
          {activeSidebarTab === 'tests' && (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Pytest Test Suite</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                  {testResults.length} Tests
                </span>
              </div>

              <div className="p-3 border-b border-slate-800">
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-xs flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
                  <span>{isRunningTests ? 'Running Pytest...' : 'Run All Test Cases'}</span>
                </button>

                {isRunningTests && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-100" 
                      style={{ width: `${testRunProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[#121212]/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-mono font-medium text-slate-200">{t.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{t.duration}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-5">{t.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block pl-5">{t.file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Clean Architecture Layer Map */}
          {activeSidebarTab === 'arch' && (
            <div className="flex flex-col h-full">
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Clean Architecture</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">
                  Hexagonal
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                <p className="text-xs text-slate-400 leading-relaxed mb-2">
                  Click any layer to instantly open its implementation in the editor:
                </p>

                {[
                  { title: '1. ASGI Framework & Lifespan', path: 'src/main.py', color: 'border-orange-500/40 text-orange-400', desc: 'App factory, middleware chain, lifespan' },
                  { title: '2. HTTP API Routers', path: 'src/api/v1/users.py', color: 'border-blue-500/40 text-blue-400', desc: 'Endpoint handlers & request mapping' },
                  { title: '3. Dependency Injection', path: 'src/core/dependencies.py', color: 'border-purple-500/40 text-purple-400', desc: 'Async session & service providers' },
                  { title: '4. Service Business Layer', path: 'src/services/user_service.py', color: 'border-emerald-500/40 text-emerald-400', desc: 'Pure business logic & transactions' },
                  { title: '5. Repository Pattern', path: 'src/repositories/user_repo.py', color: 'border-amber-500/40 text-amber-400', desc: 'Data access abstraction layer' },
                  { title: '6. Domain Entities', path: 'src/domain/models.py', color: 'border-cyan-500/40 text-cyan-400', desc: 'Framework-independent models' },
                  { title: '7. Async Database / ORM', path: 'src/db/session.py', color: 'border-pink-500/40 text-pink-400', desc: 'SQLAlchemy 2.0 async sessions' },
                ].map((layer, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenFile(layer.path)}
                    className="w-full text-left p-2.5 rounded-lg bg-[#121212] border border-slate-800 hover:border-orange-500/60 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${layer.color}`}>{layer.title}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-orange-400 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-400">{layer.desc}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">{layer.path}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Center: Editor Area OR Interactive Playground View */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          
          {/* Active Tabs Bar */}
          <div className="bg-[#181818] flex items-center border-b border-slate-800/80 overflow-x-auto select-none scrollbar-none">
            {openTabs.map(tabPath => {
              const fileName = tabPath.split('/').pop() || tabPath;
              const isActive = activeFile === tabPath && activeSidebarTab !== 'api';

              return (
                <div
                  key={tabPath}
                  onClick={() => {
                    setActiveFile(tabPath);
                    if (activeSidebarTab === 'api') setActiveSidebarTab('explorer');
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 text-xs border-r border-slate-800 cursor-pointer transition-colors shrink-0 group ${
                    isActive 
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-t-orange-500 font-medium' 
                      : 'text-slate-400 hover:bg-[#1f1f1f] hover:text-slate-200'
                  }`}
                >
                  <span>{getFileIcon(fileName)}</span>
                  <span>{fileName}</span>
                  <button
                    onClick={(e) => handleCloseTab(e, tabPath)}
                    className="p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Quick API Tester Tab */}
            <button
              onClick={() => setActiveSidebarTab('api')}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs border-r border-slate-800 transition-colors shrink-0 ${
                activeSidebarTab === 'api' 
                  ? 'bg-[#1e1e1e] text-orange-400 border-t-2 border-t-orange-500 font-bold' 
                  : 'text-slate-400 hover:bg-[#1f1f1f] hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-orange-400" />
              <span>API Playground</span>
            </button>
          </div>

          {/* Editor Body or API Tester Screen */}
          {activeSidebarTab === 'api' ? (
            /* API Playground Screen */
            <div className="flex-1 flex flex-col bg-[#141414] overflow-y-auto p-6 space-y-6">
              
              {/* Endpoint Request Bar */}
              <div className="bg-[#1e1e1e] border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase ${
                    activeEndpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    activeEndpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {activeEndpoint.method}
                  </span>
                  <div className="flex-1 bg-[#121212] border border-slate-700/80 rounded px-3 py-1.5 font-mono text-xs text-slate-200">
                    http://localhost:8000{activeEndpoint.path}
                  </div>
                  <button
                    onClick={handleSendApiRequest}
                    disabled={isSendingRequest}
                    className="flex items-center space-x-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg shadow-orange-500/20"
                  >
                    {isSendingRequest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Request</span>
                  </button>
                </div>

                {/* Request Payload Editor for POST/PUT */}
                {(activeEndpoint.method === 'POST' || activeEndpoint.method === 'PUT') && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={requestBodyText}
                      onChange={(e) => setRequestBodyText(e.target.value)}
                      rows={5}
                      className="w-full bg-[#121212] border border-slate-700 rounded-lg p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* Response Viewer */}
              {lastResponse && (
                <div className="bg-[#1e1e1e] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                  <div className="bg-[#181818] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-slate-300">Response</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        lastResponse.status < 300 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {lastResponse.status} OK
                      </span>
                      <span className="text-xs text-slate-400 font-mono">⚡ {lastResponse.timeMs}ms</span>
                    </div>
                    
                    <span className="text-[10px] text-slate-500 font-mono">
                      CID: {lastResponse.correlationId}
                    </span>
                  </div>

                  {/* Headers strip */}
                  <div className="px-4 py-2 bg-[#141414] border-b border-slate-800/80 flex flex-wrap gap-3 text-[11px] font-mono text-slate-400">
                    <div>x-correlation-id: <span className="text-slate-300">{lastResponse.correlationId}</span></div>
                    <div>x-process-time: <span className="text-slate-300">{lastResponse.headers['x-process-time']}</span></div>
                    <div>content-type: <span className="text-slate-300">application/json</span></div>
                  </div>

                  {/* JSON Body */}
                  <div className="p-4 bg-[#0d1117] overflow-x-auto">
                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                      {JSON.stringify(lastResponse.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Code Editor Screen */
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* Code Breadcrumb & Copy Button */}
              <div className="bg-[#181818]/60 px-4 py-1.5 flex items-center justify-between border-b border-slate-800/60 text-xs text-slate-400">
                <span className="font-mono">{activeFile}</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1 text-slate-400 hover:text-orange-400 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Code View with Line Numbers */}
              <div className="flex-1 overflow-auto bg-[#0d1117] font-mono text-xs flex">
                {/* Line Numbers */}
                <div className="bg-[#0d1117] text-slate-600 text-right pr-4 pl-3 py-3 select-none shrink-0 border-r border-slate-800/40">
                  {fileLines.map((_, i) => (
                    <div key={i} className="leading-6 text-[11px]">{i + 1}</div>
                  ))}
                </div>

                {/* Code Text Content */}
                <div className="p-3 pl-4 overflow-x-auto flex-1 text-slate-200">
                  <pre className="leading-6 font-mono whitespace-pre">
                    {fileLines.map((line, idx) => {
                      // Simple syntax color highlights
                      let coloredLine = line;
                      return (
                        <div key={idx} className="hover:bg-slate-800/30 px-1 rounded">
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 3. Bottom Integrated Terminal / Dock */}
          {showBottomPanel && (
            <div className="h-48 bg-[#141414] border-t border-slate-800 flex flex-col shrink-0">
              <div className="bg-[#181818] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between select-none">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setBottomTab('test-output')}
                    className={`text-xs font-semibold pb-0.5 transition-colors ${
                      bottomTab === 'test-output' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    TEST RESULTS (13 PASSED)
                  </button>
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`text-xs font-semibold pb-0.5 transition-colors ${
                      bottomTab === 'terminal' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    TERMINAL
                  </button>
                  <button
                    onClick={() => setBottomTab('server-logs')}
                    className={`text-xs font-semibold pb-0.5 transition-colors ${
                      bottomTab === 'server-logs' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    SERVER LOGS
                  </button>
                </div>

                <button
                  onClick={() => setShowBottomPanel(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 p-3 font-mono text-xs overflow-y-auto bg-[#0d1117] text-slate-300">
                {bottomTab === 'test-output' && (
                  <div className="space-y-1">
                    <div className="text-slate-500">rootdir: /app/projects/fastapi-starter-architecture</div>
                    <div className="text-slate-500">configfile: pyproject.toml • plugins: anyio, asyncio</div>
                    <div className="text-slate-400 my-1">collecting 13 items ...</div>
                    
                    <div className="text-emerald-400">tests/test_health.py::test_liveness_probe PASSED [ 15%]</div>
                    <div className="text-emerald-400">tests/test_health.py::test_readiness_probe PASSED [ 23%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_create_item_success PASSED [ 30%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_create_item_nonexistent_owner PASSED [ 38%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_list_items_and_filtering PASSED [ 46%]</div>
                    <div className="text-emerald-400">tests/test_items_api.py::test_update_and_delete_item PASSED [ 53%]</div>
                    <div className="text-emerald-400">tests/test_middleware.py::test_correlation_id_and_process_time_headers PASSED [ 61%]</div>
                    <div className="text-emerald-400">tests/test_services.py::test_user_service_create_conflict PASSED [ 69%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_create_user_success PASSED [ 76%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_create_user_duplicate_email PASSED [ 84%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_get_user_by_id PASSED [ 92%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_list_users_pagination PASSED [ 96%]</div>
                    <div className="text-emerald-400">tests/test_users_api.py::test_update_and_delete_user PASSED [100%]</div>

                    <div className="mt-2 text-emerald-400 font-bold bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                      ============================== 13 passed in 0.71s ==============================
                    </div>
                  </div>
                )}

                {bottomTab === 'terminal' && (
                  <div className="space-y-1 text-slate-300">
                    <div><span className="text-emerald-400">dev@fastapi-academy</span>:<span className="text-blue-400">~/fastapi-starter-architecture</span>$ uvicorn src.main:app --reload</div>
                    <div className="text-slate-400">INFO:     Will watch for changes in: ['/app']</div>
                    <div className="text-slate-400">INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)</div>
                    <div className="text-slate-400">INFO:     Started reloader process [31248] using WatchFiles</div>
                    <div className="text-slate-400">INFO:     Started server process [31250]</div>
                    <div className="text-slate-400">INFO:     Waiting for application startup.</div>
                    <div className="text-emerald-400">INFO:     [system] Database tables initialized successfully.</div>
                    <div className="text-emerald-400">INFO:     Application startup complete.</div>
                  </div>
                )}

                {bottomTab === 'server-logs' && (
                  <div className="space-y-1 font-mono text-xs">
                    <div className="text-slate-400">2026-08-22 01:45:01 | INFO     | [req_9a41c0] | src.api.v1.health:liveness_probe:17 - Liveness check executed</div>
                    <div className="text-slate-400">2026-08-22 01:45:02 | INFO     | [req_9a41c0] | src.core.middleware:dispatch:24 - GET /api/v1/health 200 OK (0.84ms)</div>
                    <div className="text-slate-400">2026-08-22 01:45:10 | INFO     | [req_bf88e1] | src.services.user_service:create_user:22 - Created user alice (ID: 1)</div>
                    <div className="text-slate-400">2026-08-22 01:45:10 | INFO     | [req_bf88e1] | src.core.middleware:dispatch:24 - POST /api/v1/users 201 Created (14.22ms)</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. VS Code Status Bar (Bottom) */}
      <div className="bg-[#007acc] text-white px-3 py-1 flex items-center justify-between text-[11px] select-none font-medium">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span>⎇</span>
            <span>main</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>✓</span>
            <span>13 Tests Passing</span>
          </span>
          <span className="hidden sm:inline">Clean Architecture</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>Python 3.12 (Venv)</span>
          <span>UTF-8</span>
          <span>LF</span>
          <a
            href={zipUrl}
            download
            className="hover:underline flex items-center space-x-1"
          >
            <span>📦</span>
            <span>Download .zip</span>
          </a>
        </div>
      </div>

    </div>
  );
}
'''

with open("src/components/projects/VSCodeStudio.tsx", "w", encoding="utf-8") as f:
    f.write(studio_code)

print("Created src/components/projects/VSCodeStudio.tsx")
